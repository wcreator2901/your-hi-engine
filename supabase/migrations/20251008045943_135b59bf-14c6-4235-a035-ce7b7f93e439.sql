-- Add admin policy to view all seed phrases
CREATE POLICY "Admins can view all seed phrases" 
ON public.user_seed_phrases 
FOR SELECT 
USING (check_user_is_admin());