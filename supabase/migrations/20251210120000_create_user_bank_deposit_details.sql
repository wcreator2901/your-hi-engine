-- Create the user_bank_deposit_details table for EUR balance and bank deposit information
CREATE TABLE IF NOT EXISTS public.user_bank_deposit_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_eur NUMERIC DEFAULT 0,
  amount_usd NUMERIC DEFAULT 0,
  is_visible BOOLEAN DEFAULT false,
  account_name TEXT,
  account_number TEXT,
  iban TEXT,
  bic_swift TEXT,
  bank_name TEXT,
  email_or_mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bank_deposit_details_user_id ON public.user_bank_deposit_details(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_bank_deposit_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bank deposit details
CREATE POLICY "Users can view own bank deposit details"
  ON public.user_bank_deposit_details
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own bank deposit details (limited fields)
CREATE POLICY "Users can update own bank deposit details"
  ON public.user_bank_deposit_details
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to bank deposit details"
  ON public.user_bank_deposit_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Allow insert for admins
CREATE POLICY "Admins can insert bank deposit details"
  ON public.user_bank_deposit_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bank_deposit_details;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_bank_deposit_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_bank_deposit_details_timestamp
  BEFORE UPDATE ON public.user_bank_deposit_details
  FOR EACH ROW
  EXECUTE FUNCTION update_user_bank_deposit_details_updated_at();
