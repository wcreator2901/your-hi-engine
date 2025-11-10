-- Add admin policies for viewing recovery phrases
CREATE POLICY "Admins can view all recovery phrases" 
ON public.user_recovery_phrases 
FOR SELECT 
USING (check_user_is_admin(auth.uid()));