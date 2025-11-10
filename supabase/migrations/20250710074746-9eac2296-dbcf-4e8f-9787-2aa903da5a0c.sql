-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT NOT NULL,
  front_document_url TEXT,
  back_document_url TEXT,
  front_document_name TEXT,
  back_document_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  review_notes TEXT
);

-- Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own KYC submissions
CREATE POLICY "Users can insert their own KYC submissions"
ON public.kyc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own KYC submissions
CREATE POLICY "Users can view their own KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all KYC submissions
CREATE POLICY "Admins can view all KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (check_user_is_admin(auth.uid()));

-- Admins can update all KYC submissions
CREATE POLICY "Admins can update all KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (check_user_is_admin(auth.uid()));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false);

-- Create storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' 
  AND check_user_is_admin(auth.uid())
);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_kyc_updated_at();