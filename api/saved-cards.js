// /api/saved-cards.js — GET/POST/DELETE for the user's saved cards
// Authenticated users only. Cards sync across devices.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in required" });
  }
  const accessToken = authHeader.slice(7);

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) return res.status(401).json({ error: "Invalid token" });

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("saved_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ cards: data || [] });
    }

    if (req.method === "POST") {
      const { card, action } = req.body;

      if (action === "bulk_migrate") {
        // For migrating anonymous saved cards on first sign-in
        const cards = req.body.cards || [];
        if (!Array.isArray(cards) || cards.length === 0) {
          return res.status(200).json({ migrated: 0 });
        }
        const inserts = cards.map(c => ({
          user_id: user.id,
          card_data: c,
          original_problem: c.original_problem || null,
          source_title: c.source_title || null,
          domain: c.domain || null,
        }));
        const { error } = await supabase.from("saved_cards").insert(inserts);
        if (error) throw error;
        return res.status(200).json({ migrated: cards.length });
      }

      if (!card) return res.status(400).json({ error: "Card required" });

      // Avoid duplicates (same user, source_title, domain)
      if (card.source_title && card.domain) {
        const { data: existing } = await supabase
          .from("saved_cards")
          .select("id")
          .eq("user_id", user.id)
          .eq("source_title", card.source_title)
          .eq("domain", card.domain)
          .maybeSingle();
        if (existing) return res.status(200).json({ duplicate: true });
      }

      const { data, error } = await supabase
        .from("saved_cards")
        .insert({
          user_id: user.id,
          card_data: card,
          original_problem: card.original_problem || null,
          source_title: card.source_title || null,
          domain: card.domain || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ card: data });
    }

    if (req.method === "DELETE") {
      const { source_title, domain } = req.body;
      const { error } = await supabase
        .from("saved_cards")
        .delete()
        .eq("user_id", user.id)
        .eq("source_title", source_title)
        .eq("domain", domain);
      if (error) throw error;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Saved cards error:", err);
    return res.status(500).json({ error: err.message });
  }
}
