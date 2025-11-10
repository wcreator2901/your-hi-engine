-- Allow super admins to view all user profiles for admin functions
CREATE POLICY "Super admins can view all user profiles" 
ON public.user_profiles 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) = 'super_admin');

-- Allow admins to view all user profiles for admin functions
CREATE POLICY "Admins can view all user profiles" 
ON public.user_profiles 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) = 'admin');