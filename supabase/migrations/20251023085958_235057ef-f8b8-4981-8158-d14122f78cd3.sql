
-- Add admin policy to allow admins to insert staking records for any user
CREATE POLICY "Admins can insert any staking record"
ON public.user_staking
FOR INSERT
TO authenticated
WITH CHECK (check_user_is_admin(auth.uid()));
