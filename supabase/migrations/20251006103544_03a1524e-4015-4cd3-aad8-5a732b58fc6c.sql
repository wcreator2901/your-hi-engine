-- Add admin policy to view all user wallets
CREATE POLICY "Admins can view all wallets"
ON public.user_wallets
FOR SELECT
TO authenticated
USING (check_user_is_admin());

-- Add admin policy to update all user wallets (for balance/address editing)
CREATE POLICY "Admins can update all wallets"
ON public.user_wallets
FOR UPDATE
TO authenticated
USING (check_user_is_admin());