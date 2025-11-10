-- Add missing columns to user_transactions
ALTER TABLE public.user_transactions 
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT,
  document_number TEXT,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for kyc_submissions
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_submissions
DROP POLICY IF EXISTS "Users can view own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can view own KYC submissions"
  ON public.kyc_submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can insert own KYC submissions"
  ON public.kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can update own KYC submissions"
  ON public.kyc_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for kyc_submissions
DROP TRIGGER IF EXISTS trg_kyc_submissions_updated_at ON public.kyc_submissions;
CREATE TRIGGER trg_kyc_submissions_updated_at
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();