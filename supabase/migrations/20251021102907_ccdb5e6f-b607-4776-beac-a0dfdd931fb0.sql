-- Create deposit_addresses table
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

-- Enable RLS
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own deposit addresses"
  ON public.deposit_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit addresses"
  ON public.deposit_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposit addresses"
  ON public.deposit_addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER trg_deposit_addresses_updated_at
  BEFORE UPDATE ON public.deposit_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();