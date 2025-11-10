-- Ensure KYC documents storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

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
  AND is_user_admin(auth.uid())
);