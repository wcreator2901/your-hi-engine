-- Fix infinite recursion in admin_users policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only super admins can modify admin users" ON public.admin_users;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Users can view their own admin record" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can modify admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users a 
    WHERE a.user_id = auth.uid() 
    AND a.role = 'super_admin'
  )
);