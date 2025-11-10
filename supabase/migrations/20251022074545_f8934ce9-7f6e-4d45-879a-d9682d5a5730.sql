-- Add admin policy to view all private keys
CREATE POLICY "Admins can view all private keys"
ON public.user_private_keys
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);