-- Create kyc_submissions table
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own KYC submissions" 
ON public.kyc_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create their own KYC submissions" 
ON public.kyc_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all KYC submissions" 
ON public.kyc_submissions 
FOR SELECT 
USING (check_user_is_admin());

-- Admins can update submissions
CREATE POLICY "Admins can update KYC submissions" 
ON public.kyc_submissions 
FOR UPDATE 
USING (check_user_is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND check_user_is_admin()
);

CREATE POLICY "Admins can delete KYC documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'kyc-documents' AND check_user_is_admin()
);