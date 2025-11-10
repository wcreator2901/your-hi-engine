-- Create default_crypto_addresses table for system-wide BTC and USDT_TRON addresses
CREATE TABLE IF NOT EXISTS public.default_crypto_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  btc_address TEXT,
  usdt_trc20_address TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_crypto_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for default_crypto_addresses
CREATE POLICY "Admins can manage default addresses"
  ON public.default_crypto_addresses
  FOR ALL
  USING (check_user_is_admin());

CREATE POLICY "Anyone can view default addresses"
  ON public.default_crypto_addresses
  FOR SELECT
  USING (true);

-- Create deposit_addresses table for user deposit addresses
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposit_addresses
CREATE POLICY "Users can view own deposit addresses"
  ON public.deposit_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit addresses"
  ON public.deposit_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposit addresses"
  ON public.deposit_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit addresses"
  ON public.deposit_addresses
  FOR SELECT
  USING (check_user_is_admin());

CREATE POLICY "Admins can update all deposit addresses"
  ON public.deposit_addresses
  FOR UPDATE
  USING (check_user_is_admin());

-- Update user_seed_phrases table to add encrypted and admin columns
ALTER TABLE public.user_seed_phrases 
  ADD COLUMN IF NOT EXISTS seed_phrase_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS seed_phrase_admin TEXT,
  ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT false;

-- Update existing seed_phrase column to be nullable (will be deprecated)
ALTER TABLE public.user_seed_phrases 
  ALTER COLUMN seed_phrase DROP NOT NULL;

-- Create trigger for updating updated_at on default_crypto_addresses
CREATE TRIGGER update_default_crypto_addresses_updated_at
  BEFORE UPDATE ON public.default_crypto_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on deposit_addresses
CREATE TRIGGER update_deposit_addresses_updated_at
  BEFORE UPDATE ON public.deposit_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial default addresses row (empty, to be configured by admin)
INSERT INTO public.default_crypto_addresses (btc_address, usdt_trc20_address)
VALUES (NULL, NULL)
ON CONFLICT DO NOTHING;