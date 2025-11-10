-- Add DELETE policy for admins on kyc_submissions table
CREATE POLICY "Admins can delete KYC submissions"
ON public.kyc_submissions
FOR DELETE
TO authenticated
USING (check_user_is_admin());