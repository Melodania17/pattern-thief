// /api/user-status.js — Returns the user's account state
// Used by the frontend to know what to show (Pro badge, search count, refund eligibility, etc.)

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FREE_LIMIT = 5;
const EARLY_BIRD_TOTAL = 100;
const EARLY_BIRD_OFFSET = 11; // Start the counter at 11 so it appears 11 people have purchased

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Get the early bird counter (public info)
    const { data: earlyBirdCount } = await supabase.rpc("get_early_bird_count");
    const actualPurchases = earlyBirdCount || 0;
    const displayedCount = actualPurchases + EARLY_BIRD_OFFSET;
    const spotsLeft = Math.max(0, EARLY_BIRD_TOTAL - displayedCount);

    const publicData = {
      early_bird_spots_left: spotsLeft,
      early_bird_total: EARLY_BIRD_TOTAL,
      early_bird_purchased: displayedCount,
    };

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(200).json({ ...publicData, authenticated: false });
    }

    const accessToken = authHeader.slice(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(200).json({ ...publicData, authenticated: false });
    }

    // Get purchase status — use limit(1) instead of maybeSingle in case of multiple completed rows (duplicate webhook fires, etc.)
    const { data: purchases } = await supabase
      .from("purchases")
      .select("status, pro_tier, source, refund_eligible_until, amount_paid_cents, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);
    const purchase = purchases && purchases.length > 0 ? purchases[0] : null;

    const isPro = !!purchase;
    const now = new Date();
    const refundEligible = purchase?.refund_eligible_until
      ? new Date(purchase.refund_eligible_until) > now && purchase.source === "stripe"
      : false;

    // Get search usage
    const { data: usage } = await supabase
      .from("search_usage")
      .select("searches_used, bonus_searches")
      .eq("user_id", user.id)
      .maybeSingle();

    const searchesUsed = usage?.searches_used || 0;
    const bonusSearches = usage?.bonus_searches || 0;
    const searchesAllowed = FREE_LIMIT + bonusSearches;

    return res.status(200).json({
      ...publicData,
      authenticated: true,
      email: user.email,
      user_id: user.id,
      is_pro: isPro,
      pro_tier: purchase?.pro_tier || null,
      pro_source: purchase?.source || null,
      refund_eligible: refundEligible,
      refund_eligible_until: purchase?.refund_eligible_until || null,
      purchase_amount_cents: purchase?.amount_paid_cents || 0,
      purchase_date: purchase?.created_at || null,
      searches_used: searchesUsed,
      searches_allowed: searchesAllowed,
      bonus_searches: bonusSearches,
    });
  } catch (err) {
    console.error("user-status error:", err);
    return res.status(500).json({ error: err.message });
  }
}
