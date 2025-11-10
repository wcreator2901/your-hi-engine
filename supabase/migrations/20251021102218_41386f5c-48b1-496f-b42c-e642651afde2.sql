-- Add missing columns to existing tables
ALTER TABLE public.user_wallets 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS wallet_name TEXT;

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create default_crypto_addresses table
CREATE TABLE IF NOT EXISTS public.default_crypto_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  btc_address TEXT,
  usdt_trc20_address TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_seed_phrases table
CREATE TABLE IF NOT EXISTS public.user_seed_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  encrypted_seed_phrase TEXT NOT NULL,
  seed_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create visitor_activity table
CREATE TABLE IF NOT EXISTS public.visitor_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT,
  user_id UUID,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  duration_seconds INTEGER DEFAULT 0,
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_seed_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for default_crypto_addresses
DROP POLICY IF EXISTS "Users can view default addresses" ON public.default_crypto_addresses;
CREATE POLICY "Users can view default addresses"
  ON public.default_crypto_addresses FOR SELECT
  USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Users can insert default addresses" ON public.default_crypto_addresses;
CREATE POLICY "Users can insert default addresses"
  ON public.default_crypto_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update default addresses" ON public.default_crypto_addresses;
CREATE POLICY "Users can update default addresses"
  ON public.default_crypto_addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_seed_phrases
DROP POLICY IF EXISTS "Users can view own seed phrases" ON public.user_seed_phrases;
CREATE POLICY "Users can view own seed phrases"
  ON public.user_seed_phrases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own seed phrases" ON public.user_seed_phrases;
CREATE POLICY "Users can insert own seed phrases"
  ON public.user_seed_phrases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own seed phrases" ON public.user_seed_phrases;
CREATE POLICY "Users can update own seed phrases"
  ON public.user_seed_phrases FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for visitor_activity
DROP POLICY IF EXISTS "Admins can view all visitor activity" ON public.visitor_activity;
CREATE POLICY "Admins can view all visitor activity"
  ON public.visitor_activity FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert visitor activity" ON public.visitor_activity;
CREATE POLICY "Anyone can insert visitor activity"
  ON public.visitor_activity FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update visitor activity" ON public.visitor_activity;
CREATE POLICY "Anyone can update visitor activity"
  ON public.visitor_activity FOR UPDATE
  USING (true);

-- Triggers
DROP TRIGGER IF EXISTS trg_default_crypto_addresses_updated_at ON public.default_crypto_addresses;
CREATE TRIGGER trg_default_crypto_addresses_updated_at
  BEFORE UPDATE ON public.default_crypto_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_seed_phrases_updated_at ON public.user_seed_phrases;
CREATE TRIGGER trg_user_seed_phrases_updated_at
  BEFORE UPDATE ON public.user_seed_phrases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_visitor_activity_updated_at ON public.visitor_activity;
CREATE TRIGGER trg_visitor_activity_updated_at
  BEFORE UPDATE ON public.visitor_activity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix RPC function parameter name
DROP FUNCTION IF EXISTS public.check_user_is_admin(UUID);
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT 
    COALESCE(
      (raw_app_meta_data->>'is_admin')::BOOLEAN,
      false
    ) INTO is_admin
  FROM auth.users
  WHERE id = check_user_id;
  
  RETURN COALESCE(is_admin, false);
END;
$$;