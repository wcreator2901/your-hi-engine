-- Add admin access policies for user_wallets
CREATE POLICY "Admins can view all user wallets" 
ON public.user_wallets 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can update all user wallets" 
ON public.user_wallets 
FOR UPDATE 
USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

-- Add admin access policies for deposit_addresses
CREATE POLICY "Admins can view all deposit addresses" 
ON public.deposit_addresses 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can update all deposit addresses" 
ON public.deposit_addresses 
FOR UPDATE 
USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));