-- Add missing columns to user_seed_phrases
ALTER TABLE public.user_seed_phrases 
  ADD COLUMN IF NOT EXISTS seed_phrase TEXT,
  ADD COLUMN IF NOT EXISTS seed_phrase_admin TEXT;

-- Create user_login_tracking table
CREATE TABLE IF NOT EXISTS public.user_login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  login_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  login_status TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ip_blocks table
CREATE TABLE IF NOT EXISTS public.ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create smart_contracts table
CREATE TABLE IF NOT EXISTS public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  contract_type TEXT,
  abi JSONB,
  deployment_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_login_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_login_tracking
DROP POLICY IF EXISTS "Users can view own login tracking" ON public.user_login_tracking;
CREATE POLICY "Users can view own login tracking"
  ON public.user_login_tracking FOR SELECT
  USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Anyone can insert login tracking" ON public.user_login_tracking;
CREATE POLICY "Anyone can insert login tracking"
  ON public.user_login_tracking FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ip_blocks
DROP POLICY IF EXISTS "Anyone can view ip blocks" ON public.ip_blocks;
CREATE POLICY "Anyone can view ip blocks"
  ON public.ip_blocks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert ip blocks" ON public.ip_blocks;
CREATE POLICY "Admins can insert ip blocks"
  ON public.ip_blocks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update ip blocks" ON public.ip_blocks;
CREATE POLICY "Admins can update ip blocks"
  ON public.ip_blocks FOR UPDATE
  USING (true);

-- RLS Policies for smart_contracts
DROP POLICY IF EXISTS "Anyone can view smart contracts" ON public.smart_contracts;
CREATE POLICY "Anyone can view smart contracts"
  ON public.smart_contracts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert smart contracts" ON public.smart_contracts;
CREATE POLICY "Admins can insert smart contracts"
  ON public.smart_contracts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update smart contracts" ON public.smart_contracts;
CREATE POLICY "Admins can update smart contracts"
  ON public.smart_contracts FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admins can delete smart contracts" ON public.smart_contracts;
CREATE POLICY "Admins can delete smart contracts"
  ON public.smart_contracts FOR DELETE
  USING (true);

-- Triggers
DROP TRIGGER IF EXISTS trg_user_login_tracking_updated_at ON public.user_login_tracking;
CREATE TRIGGER trg_user_login_tracking_updated_at
  BEFORE UPDATE ON public.user_login_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ip_blocks_updated_at ON public.ip_blocks;
CREATE TRIGGER trg_ip_blocks_updated_at
  BEFORE UPDATE ON public.ip_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_smart_contracts_updated_at ON public.smart_contracts;
CREATE TRIGGER trg_smart_contracts_updated_at
  BEFORE UPDATE ON public.smart_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();