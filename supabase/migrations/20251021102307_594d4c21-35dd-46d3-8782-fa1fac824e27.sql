-- Add missing columns to visitor_activity
ALTER TABLE public.visitor_activity 
  ADD COLUMN IF NOT EXISTS page_title TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS os TEXT,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT now();

-- Add missing columns to smart_contracts
ALTER TABLE public.smart_contracts 
  ADD COLUMN IF NOT EXISTS contract_description TEXT,
  ADD COLUMN IF NOT EXISTS contract_code TEXT,
  ADD COLUMN IF NOT EXISTS is_deployed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deployment_address TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add missing columns to user_staking
ALTER TABLE public.user_staking 
  ADD COLUMN IF NOT EXISTS asset_symbol TEXT DEFAULT 'ETH',
  ADD COLUMN IF NOT EXISTS last_calculation_time TIMESTAMPTZ;

-- Create contract_wallets table
CREATE TABLE IF NOT EXISTS public.contract_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_name TEXT,
  balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for contract_wallets
ALTER TABLE public.contract_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_wallets
DROP POLICY IF EXISTS "Anyone can view contract wallets" ON public.contract_wallets;
CREATE POLICY "Anyone can view contract wallets"
  ON public.contract_wallets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert contract wallets" ON public.contract_wallets;
CREATE POLICY "Admins can insert contract wallets"
  ON public.contract_wallets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update contract wallets" ON public.contract_wallets;
CREATE POLICY "Admins can update contract wallets"
  ON public.contract_wallets FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admins can delete contract wallets" ON public.contract_wallets;
CREATE POLICY "Admins can delete contract wallets"
  ON public.contract_wallets FOR DELETE
  USING (true);

-- Trigger for contract_wallets
DROP TRIGGER IF EXISTS trg_contract_wallets_updated_at ON public.contract_wallets;
CREATE TRIGGER trg_contract_wallets_updated_at
  BEFORE UPDATE ON public.contract_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();