-- Allow admins to view all user seed phrases for recovery purposes
CREATE POLICY "Admins can view all user seed phrases" 
ON public.user_seed_phrases 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);