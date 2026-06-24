// /api/stripe-refund.js — Self-serve refund within 14 days
// User clicks "Cancel & Refund" → this fires → Stripe refunds → user loses Pro → confirmation email sent

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getRefundEmailHTML(email, amountCents) {
  const amountUsd = (amountCents / 100).toFixed(2);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Pattern Thief refund has been processed</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0c0c11; color:#f1f1f1; margin:0; padding:40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background:#18181f; border-radius: 16px; padding: 32px;">
    <h1 style="color:#f5f5f5; font-size: 26px; font-weight: 900; margin: 0 0 16px;">Your refund is on its way.</h1>
    <p style="font-size: 15px; line-height: 1.6; color:rgba(255,255,255,0.85); margin: 0 0 16px;">
      We've processed your refund of <strong style="color:#d4a843;">$${amountUsd}</strong>. It should appear on your card within 5-10 business days, depending on your bank.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color:rgba(255,255,255,0.65); margin: 0 0 22px;">
      Your Pro access has been deactivated. You can still use Pattern Thief on the free tier anytime — no need to create a new account.
    </p>
    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 18px; margin: 0 0 22px;">
      <p style="font-size: 13px; line-height: 1.5; color:rgba(255,255,255,0.7); margin: 0;">
        If something didn't work for you, we'd genuinely love to hear why. Hit reply and tell us — feedback helps us build a better tool.
      </p>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.5); margin: 0;">
      Thanks for giving Pattern Thief a try.<br><br>
      — The Pattern Thief team<br>
      <a href="mailto:Prashant@BeyondSingular.com" style="color: #d4a843;">Prashant@BeyondSingular.com</a>
    </p>
  </div>
  <p style="text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); margin: 24px 0 0;">
    Pattern Thief · Created by Prashant Anilkumar · © 2026
  </p>
</body>
</html>
  `;
}

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

    // Send refund confirmation email (non-blocking — don't fail the refund if email fails)
    if (resend && purchase.email) {
      try {
        await resend.emails.send({
          from: "Pattern Thief <noreply@patternthief.com>",
          to: purchase.email,
          subject: "Your Pattern Thief refund has been processed",
          html: getRefundEmailHTML(purchase.email, refund.amount),
        });
      } catch (emailErr) {
        console.error("Refund email failed (non-fatal):", emailErr);
      }
    }

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
