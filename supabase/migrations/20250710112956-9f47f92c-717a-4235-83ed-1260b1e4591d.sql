-- Add missing RLS policy to allow users to update their own KYC submissions
CREATE POLICY "Users can update their own KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);