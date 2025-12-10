-- Create user_bank_deposit_details table for admin-configured bank details
CREATE TABLE public.user_bank_deposit_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_eur NUMERIC DEFAULT 0,
  amount_usd NUMERIC DEFAULT 0,
  is_visible BOOLEAN DEFAULT false,
  account_name TEXT,
  account_number TEXT,
  iban TEXT,
  bic_swift TEXT,
  bank_name TEXT,
  email_or_mobile TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_bank_deposit_details ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can view all bank deposit details"
  ON public.user_bank_deposit_details
  FOR SELECT
  USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can insert bank deposit details"
  ON public.user_bank_deposit_details
  FOR INSERT
  WITH CHECK (check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can update bank deposit details"
  ON public.user_bank_deposit_details
  FOR UPDATE
  USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete bank deposit details"
  ON public.user_bank_deposit_details
  FOR DELETE
  USING (check_user_is_admin(auth.uid()));

-- Policy for users to view their own bank deposit details
CREATE POLICY "Users can view own bank deposit details"
  ON public.user_bank_deposit_details
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_user_bank_deposit_details_updated_at
  BEFORE UPDATE ON public.user_bank_deposit_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();