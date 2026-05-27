// /api/stripe-checkout.js — Creates a Stripe Checkout Session for $37 lifetime
// Called from the frontend when the user clicks "Upgrade to Lifetime"

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

    // Verify the user
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    // Check if already Pro
    const { data: existingPurchases } = await supabase
      .from("purchases")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .limit(1);
    const existingPurchase = existingPurchases && existingPurchases.length > 0 ? existingPurchases[0] : null;

    if (existingPurchase) {
      return res.status(400).json({ error: "Already Pro" });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const priceCents = 3700; // $37 early bird

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Pattern Thief — Lifetime Access",
            description: "Pay once. Own it forever. Unlimited searches, all future updates, priority access to new domain packs.",
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        email: user.email,
        product: "pattern_thief_lifetime",
      },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
