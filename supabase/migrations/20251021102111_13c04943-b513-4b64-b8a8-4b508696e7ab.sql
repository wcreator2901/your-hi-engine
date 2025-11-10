-- Add missing columns to user_wallets to match code expectations
ALTER TABLE public.user_wallets 
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS balance_crypto NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_fiat NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address_index INTEGER,
  ADD COLUMN IF NOT EXISTS derivation_path TEXT;

-- Create user_transactions table
CREATE TABLE IF NOT EXISTS public.user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  asset_symbol TEXT,
  amount_crypto NUMERIC,
  amount_fiat NUMERIC,
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  from_address TEXT,
  to_address TEXT,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  transaction_id UUID,
  account_number TEXT,
  account_name TEXT,
  email_or_mobile TEXT,
  bsb_number TEXT,
  bank_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.user_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.user_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.user_transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.user_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.user_transactions;
CREATE POLICY "Users can update own transactions"
  ON public.user_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for bank_accounts
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own bank accounts"
  ON public.bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can insert own bank accounts"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can update own bank accounts"
  ON public.bank_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
DROP TRIGGER IF EXISTS trg_user_transactions_updated_at ON public.user_transactions;
CREATE TRIGGER trg_user_transactions_updated_at
  BEFORE UPDATE ON public.user_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();