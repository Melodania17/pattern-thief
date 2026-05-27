// /api/anthropic.js — Proxy to Anthropic API with auth + usage enforcement
//
// Logic:
//   1. If user signed in & Pro → unlimited (with monthly soft cap of 300)
//   2. If user signed in & not Pro → check search_usage table (5 free + bonus)
//   3. If user NOT signed in → check free_tier_tracking by fingerprint + cookie
//
// On the 6th attempt by a free user, we run ONE blurred preview, then hard-wall.

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const FREE_LIMIT = 5;
const PREVIEW_LIMIT = 1;
const MONTHLY_SOFT_CAP = 300;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hashIP(ip) {
  return crypto.createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "default-salt")).digest("hex").slice(0, 32);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    }).filter(([k]) => k)
  );
}

function setAnonymousCookie(res, cookieId) {
  const maxAge = 365 * 24 * 60 * 60;
  res.setHeader("Set-Cookie", `pt_anon=${cookieId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Fingerprint");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const authHeader = req.headers.authorization;
    const fingerprint = req.headers["x-fingerprint"] || null;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
    const cookies = parseCookies(req);
    let cookieId = cookies.pt_anon;

    let userId = null;
    let userIsPro = false;

    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        userId = user.id;
        const { data: proCheck } = await supabase.rpc("is_user_pro", { user_uuid: user.id });
        userIsPro = !!proCheck;
      }
    }

    // Pro user monthly soft cap
    if (userIsPro) {
      const { data: usage } = await supabase
        .from("search_usage")
        .select("monthly_search_count, monthly_reset_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (usage) {
        const resetDate = new Date(usage.monthly_reset_at);
        const monthsSinceReset = (Date.now() - resetDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSinceReset >= 1) {
          await supabase
            .from("search_usage")
            .update({ monthly_search_count: 0, monthly_reset_at: new Date().toISOString() })
            .eq("user_id", userId);
        } else if (usage.monthly_search_count >= MONTHLY_SOFT_CAP) {
          return res.status(429).json({
            error: "monthly_cap",
            message: "You've hit the monthly soft cap. This refreshes monthly. Email Prashant@BeyondSingular.com if you need more.",
          });
        }
      }
    }

    let isPreview = false;

    if (userId && !userIsPro) {
      const result = await checkSignedInFreeTier(userId);
      if (result.blocked) return res.status(result.status).json(result.body);
      isPreview = !!result.preview;
    }

    if (!userId) {
      if (!fingerprint) {
        return res.status(400).json({ error: "missing_fingerprint", message: "Browser fingerprint required" });
      }
      if (!cookieId) {
        cookieId = crypto.randomBytes(16).toString("hex");
        setAnonymousCookie(res, cookieId);
      }
      const ipHash = hashIP(ip);
      const result = await checkAnonymousFreeTier(fingerprint, cookieId, ipHash);
      if (result.blocked) return res.status(result.status).json(result.body);
      isPreview = !!result.preview;
    }

    // Call Anthropic
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json(data);
    }

    if (userId && userIsPro) {
      supabase.from("search_usage")
        .update({ monthly_search_count: 1 })
        .eq("user_id", userId)
        .then(() => {})
        .catch(() => {});
    }

    if (isPreview) {
      data._is_preview = true;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Failed to call Anthropic API" });
  }
}

async function checkSignedInFreeTier(userId) {
  let { data: usage } = await supabase
    .from("search_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!usage) {
    const { data: created } = await supabase
      .from("search_usage")
      .insert({ user_id: userId, searches_used: 0, bonus_searches: 0 })
      .select()
      .single();
    usage = created;
  }

  const totalAllowed = FREE_LIMIT + (usage?.bonus_searches || 0);
  const used = usage?.searches_used || 0;

  if (used >= totalAllowed + PREVIEW_LIMIT) {
    return {
      blocked: true,
      status: 402,
      body: { error: "free_limit_reached", searches_used: used, searches_allowed: totalAllowed },
    };
  }

  await supabase
    .from("search_usage")
    .update({ searches_used: used + 1, last_search_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (used >= totalAllowed) {
    return { preview: true, blocked: false };
  }

  return { blocked: false };
}

async function checkAnonymousFreeTier(fingerprint, cookieId, ipHash) {
  let { data: tracking } = await supabase
    .from("free_tier_tracking")
    .select("*")
    .or(`fingerprint.eq.${fingerprint},cookie_id.eq.${cookieId}`)
    .order("searches_used", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tracking) {
    const { data: created } = await supabase
      .from("free_tier_tracking")
      .insert({ fingerprint, cookie_id: cookieId, ip_hash: ipHash, searches_used: 0 })
      .select()
      .single();
    tracking = created;
  }

  const used = tracking.searches_used || 0;
  const previewsUsed = tracking.preview_searches_used || 0;

  if (used >= FREE_LIMIT && previewsUsed >= PREVIEW_LIMIT) {
    return {
      blocked: true,
      status: 402,
      body: { error: "free_limit_reached", searches_used: used, searches_allowed: FREE_LIMIT },
    };
  }

  const isPreview = used >= FREE_LIMIT;

  if (isPreview) {
    await supabase
      .from("free_tier_tracking")
      .update({
        preview_searches_used: previewsUsed + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", tracking.id);
  } else {
    await supabase
      .from("free_tier_tracking")
      .update({
        searches_used: used + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", tracking.id);
  }

  return { blocked: false, preview: isPreview };
}
