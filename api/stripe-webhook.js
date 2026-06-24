// /api/stripe-webhook.js — Receives events from Stripe
// Fires when a payment completes or a refund is issued.
// Updates the purchases table accordingly.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Vercel: disable default body parsing so we can verify the raw body signature
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      }
      default:
        // Other events we don't handle
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const email = session.customer_email || session.metadata?.email;

  if (!userId || !email) {
    throw new Error("Missing user_id or email in checkout session");
  }

  const refundEligibleUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

  // Insert the purchase record
  const { error: insertError } = await supabase.from("purchases").insert({
    user_id: userId,
    email,
    stripe_customer_id: session.customer,
    stripe_payment_intent_id: session.payment_intent,
    stripe_checkout_session_id: session.id,
    amount_paid_cents: session.amount_total,
    currency: session.currency,
    status: "completed",
    pro_tier: "lifetime",
    source: "stripe",
    refund_eligible_until: refundEligibleUntil.toISOString(),
  });

  if (insertError) {
    // Likely a duplicate webhook — log but don't fail
    if (insertError.code === "23505") {
      console.log("Duplicate webhook ignored:", session.id);
      return;
    }
    throw insertError;
  }

  // Send welcome email
  if (resend) {
    try {
      await resend.emails.send({
        from: "Pattern Thief <noreply@patternthief.com>",
        to: email,
        subject: "Welcome to Pattern Thief Pro",
        html: getWelcomeEmailHTML(email),
      });
    } catch (emailErr) {
      console.error("Welcome email failed (non-fatal):", emailErr);
    }
  }
}

async function handleRefund(charge) {
  if (!charge.refunded && !charge.amount_refunded) return;

  // Find the purchase by payment intent
  const { data: purchase, error: findError } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_payment_intent_id", charge.payment_intent)
    .maybeSingle();

  if (findError || !purchase) {
    console.warn("Refund webhook: purchase not found for charge", charge.id);
    return;
  }

  await supabase
    .from("purchases")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      refund_amount_cents: charge.amount_refunded,
    })
    .eq("id", purchase.id);
}

function getWelcomeEmailHTML(email) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to Pattern Thief Pro</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0c0c11; color:#f1f1f1; margin:0; padding:40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background:#18181f; border-radius: 16px; padding: 32px;">
    <h1 style="color:#d4a843; font-size: 28px; font-weight: 900; margin: 0 0 16px;">You're in.</h1>
    <p style="font-size: 16px; line-height: 1.6; color:rgba(255,255,255,0.85); margin: 0 0 18px;">
      Welcome to Pattern Thief Pro. Your lifetime access is now active.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color:rgba(255,255,255,0.7); margin: 0 0 22px;">
      That means unlimited pattern searches, unlimited Go Deeper explorations, and priority access to every new domain pack we build. Forever. No subscriptions, no monthly charges, no nonsense.
    </p>
    <div style="background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.3); border-radius: 10px; padding: 14px 18px; margin: 0 0 22px;">
      <p style="font-size: 13px; line-height: 1.5; color:#d4a843; margin: 0; font-weight: 700;">
        ✓ Lifetime access · Pay once, yours forever
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.6); margin: 6px 0 0;">
        14-day refund window starts today — cancel anytime from your account.
      </p>
    </div>
    <a href="https://patternthief.com" style="display: inline-block; background: linear-gradient(135deg, #d4a843, #e8614d); color: #fff; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
      Start Exploring
    </a>
    <p style="font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.5); margin: 28px 0 0;">
      One last thing — feedback shapes what comes next. If you find something surprising, broken, or beautiful, hit reply. We read every email.
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.5); margin: 12px 0 0;">
      — Prashant<br>
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
