-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_symbol TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  address TEXT,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_symbol, network)
);

-- Create user_staking table
CREATE TABLE IF NOT EXISTS public.user_staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_staking BOOLEAN DEFAULT false,
  staking_start_time TIMESTAMPTZ,
  daily_yield_percent NUMERIC DEFAULT 0,
  accrued_profits NUMERIC DEFAULT 0,
  total_profits_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_staking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
CREATE POLICY "Users can view own wallets"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallets" ON public.user_wallets;
CREATE POLICY "Users can insert own wallets"
  ON public.user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
CREATE POLICY "Users can update own wallets"
  ON public.user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wallets" ON public.user_wallets;
CREATE POLICY "Users can delete own wallets"
  ON public.user_wallets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_staking
DROP POLICY IF EXISTS "Users can view own staking" ON public.user_staking;
CREATE POLICY "Users can view own staking"
  ON public.user_staking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own staking" ON public.user_staking;
CREATE POLICY "Users can insert own staking"
  ON public.user_staking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own staking" ON public.user_staking;
CREATE POLICY "Users can update own staking"
  ON public.user_staking FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_staking_updated_at ON public.user_staking;
CREATE TRIGGER trg_user_staking_updated_at
  BEFORE UPDATE ON public.user_staking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();