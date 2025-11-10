-- Add admin policy to view all seed phrases
CREATE POLICY "Admins can view all seed phrases"
ON public.user_seed_phrases
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);