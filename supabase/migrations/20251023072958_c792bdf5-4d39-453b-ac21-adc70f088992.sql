-- Add admin policy to view all user wallets
CREATE POLICY "Admins can view all wallets"
ON public.user_wallets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update all user wallets  
CREATE POLICY "Admins can update all wallets"
ON public.user_wallets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));