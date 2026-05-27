-- =====================================================================
-- Pattern Thief — Supabase Database Schema
-- Run this in the Supabase SQL Editor after creating your project.
-- =====================================================================

-- Drop existing tables if you need to start fresh (CAREFUL in production)
-- DROP TABLE IF EXISTS public.purchases CASCADE;
-- DROP TABLE IF EXISTS public.search_usage CASCADE;
-- DROP TABLE IF EXISTS public.free_tier_tracking CASCADE;
-- DROP TABLE IF EXISTS public.saved_cards CASCADE;
-- DROP TABLE IF EXISTS public.coupon_redemptions CASCADE;

-- =====================================================================
-- 1. PURCHASES — tracks who has paid for Pattern Thief Pro
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  stripe_customer_id text,
  stripe_payment_intent_id text UNIQUE,
  stripe_checkout_session_id text UNIQUE,
  amount_paid_cents integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  status text DEFAULT 'completed' NOT NULL, -- 'completed' | 'refunded' | 'pending'
  pro_tier text DEFAULT 'lifetime' NOT NULL, -- 'lifetime' | 'coupon_lifetime'
  source text DEFAULT 'stripe' NOT NULL,    -- 'stripe' | 'coupon' | 'manual'
  refund_eligible_until timestamptz,
  refunded_at timestamptz,
  refund_amount_cents integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON public.purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- =====================================================================
-- 2. SEARCH_USAGE — tracks how many searches an authenticated user has run
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.search_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  searches_used integer DEFAULT 0 NOT NULL,
  bonus_searches integer DEFAULT 0 NOT NULL, -- from coupons like THIEF2026
  last_search_at timestamptz,
  monthly_search_count integer DEFAULT 0 NOT NULL, -- soft cap protection for Pro users
  monthly_reset_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_usage_user_id ON public.search_usage(user_id);

-- =====================================================================
-- 3. FREE_TIER_TRACKING — anti-abuse for users not signed in
-- Tracks by browser fingerprint + cookie ID
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.free_tier_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  cookie_id text NOT NULL,
  ip_hash text, -- hashed for privacy
  searches_used integer DEFAULT 0 NOT NULL,
  preview_searches_used integer DEFAULT 0 NOT NULL, -- blurred previews (max 1)
  first_seen_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  converted_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_free_tier_fingerprint ON public.free_tier_tracking(fingerprint);
CREATE INDEX IF NOT EXISTS idx_free_tier_cookie ON public.free_tier_tracking(cookie_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_tier_unique ON public.free_tier_tracking(fingerprint, cookie_id);

-- =====================================================================
-- 4. SAVED_CARDS — user's bookmarked cards (persistent across devices)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_data jsonb NOT NULL, -- full card JSON
  original_problem text,
  source_title text,
  domain text,
  saved_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON public.saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_source_domain ON public.saved_cards(user_id, source_title, domain);

-- =====================================================================
-- 5. COUPON_REDEMPTIONS — tracks who used which code
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  benefit_type text NOT NULL, -- 'lifetime_pro' | 'bonus_searches'
  bonus_searches_granted integer DEFAULT 0,
  redeemed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupon_user ON public.coupon_redemptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_unique_redemption ON public.coupon_redemptions(user_id, code);

-- =====================================================================
-- 6. ROW LEVEL SECURITY (RLS) — locks down direct database access
-- =====================================================================
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
-- free_tier_tracking accessed only by server (service role), no RLS needed

-- Users can only see their own data
CREATE POLICY "Users view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users view own search usage" ON public.search_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users view own saved cards" ON public.saved_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved cards" ON public.saved_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved cards" ON public.saved_cards
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own coupons" ON public.coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================================
-- 7. HELPER FUNCTION — check if user is Pro
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_user_pro(user_uuid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.purchases
    WHERE user_id = user_uuid
      AND status = 'completed'
      AND pro_tier IN ('lifetime', 'coupon_lifetime')
  );
$$;

-- =====================================================================
-- 8. HELPER FUNCTION — count completed purchases (for "spots left" counter)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_early_bird_count()
RETURNS integer
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(COUNT(*), 0)::integer
  FROM public.purchases
  WHERE status = 'completed'
    AND pro_tier = 'lifetime'
    AND source = 'stripe';
$$;

-- =====================================================================
-- 9. AUTO-UPDATE timestamps
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS purchases_updated_at ON public.purchases;
CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS search_usage_updated_at ON public.search_usage;
CREATE TRIGGER search_usage_updated_at
  BEFORE UPDATE ON public.search_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================================
-- Schema complete. Run this whole file in the Supabase SQL Editor.
-- =====================================================================
