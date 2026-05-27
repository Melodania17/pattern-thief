// /api/redeem-coupon.js — Redeem CPSI2026 (lifetime) or THIEF2026 (+5 searches)
// Requires authentication.

import { createClient } from "@supabase/supabase-js";

const COUPONS = {
  CPSI2026: { benefit_type: "lifetime_pro", bonus_searches: 0 },
  THIEF2026: { benefit_type: "bonus_searches", bonus_searches: 5 },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Sign in required to redeem codes" });
    }
    const accessToken = authHeader.slice(7);

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    const normalizedCode = code.trim().toUpperCase();
    const coupon = COUPONS[normalizedCode];

    if (!coupon) {
      return res.status(400).json({ error: "Invalid code. Check the spelling and try again." });
    }

    // Check if already redeemed
    const { data: existing } = await supabase
      .from("coupon_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("code", normalizedCode)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "You've already redeemed this code." });
    }

    // Apply the benefit
    if (coupon.benefit_type === "lifetime_pro") {
      // Check if already Pro
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .maybeSingle();

      if (existingPurchase) {
        return res.status(400).json({ error: "You already have Pro access." });
      }

      const { error: insertError } = await supabase.from("purchases").insert({
        user_id: user.id,
        email: user.email,
        amount_paid_cents: 0,
        currency: "usd",
        status: "completed",
        pro_tier: "coupon_lifetime",
        source: "coupon",
      });
      if (insertError) throw insertError;
    } else if (coupon.benefit_type === "bonus_searches") {
      // Add bonus searches to search_usage
      let { data: usage } = await supabase
        .from("search_usage")
        .select("bonus_searches")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!usage) {
        await supabase.from("search_usage").insert({
          user_id: user.id,
          searches_used: 0,
          bonus_searches: coupon.bonus_searches,
        });
      } else {
        await supabase
          .from("search_usage")
          .update({ bonus_searches: (usage.bonus_searches || 0) + coupon.bonus_searches })
          .eq("user_id", user.id);
      }
    }

    // Log the redemption
    await supabase.from("coupon_redemptions").insert({
      user_id: user.id,
      code: normalizedCode,
      benefit_type: coupon.benefit_type,
      bonus_searches_granted: coupon.bonus_searches,
    });

    return res.status(200).json({
      success: true,
      benefit_type: coupon.benefit_type,
      bonus_searches: coupon.bonus_searches,
      message: coupon.benefit_type === "lifetime_pro"
        ? "Lifetime access activated! Welcome to Pattern Thief Pro."
        : `Code applied! You've got ${coupon.bonus_searches} more searches.`,
    });
  } catch (err) {
    console.error("Coupon redeem error:", err);
    return res.status(500).json({ error: err.message || "Failed to redeem code" });
  }
}
