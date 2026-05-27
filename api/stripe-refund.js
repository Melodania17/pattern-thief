// /api/stripe-refund.js — Self-serve refund within 14 days
// User clicks "Cancel & Refund" → this fires → Stripe refunds → user loses Pro

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    const accessToken = authHeader.slice(7);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    // Find the user's purchase
    const { data: purchases, error: findError } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);
    const purchase = purchases && purchases.length > 0 ? purchases[0] : null;

    if (findError || !purchase) {
      return res.status(404).json({ error: "No active purchase found" });
    }

    // Check refund eligibility window
    const now = new Date();
    const eligibleUntil = new Date(purchase.refund_eligible_until);
    if (now > eligibleUntil) {
      return res.status(400).json({
        error: "Refund window has closed",
        message: "Refunds are available within 14 days of purchase. Your window ended on " +
          eligibleUntil.toLocaleDateString() + ". For questions, email Prashant@BeyondSingular.com",
      });
    }

    // Process the Stripe refund
    if (!purchase.stripe_payment_intent_id) {
      return res.status(400).json({ error: "No payment intent on file" });
    }

    const refund = await stripe.refunds.create({
      payment_intent: purchase.stripe_payment_intent_id,
      reason: "requested_by_customer",
    });

    // Update purchase record immediately (webhook will also fire as a safety net)
    await supabase
      .from("purchases")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_amount_cents: refund.amount,
      })
      .eq("id", purchase.id);

    return res.status(200).json({
      success: true,
      message: "Your refund has been processed. It will appear on your card within 5-10 business days.",
      refund_amount_cents: refund.amount,
    });
  } catch (err) {
    console.error("Refund error:", err);
    return res.status(500).json({ error: err.message || "Refund failed" });
  }
}
