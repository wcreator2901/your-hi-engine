-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow super admins to manage admin_users" ON public.admin_users;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_uuid uuid)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.admin_users WHERE user_id = user_uuid LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for all authenticated users" 
ON public.admin_users 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.admin_users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for super admins" 
ON public.admin_users 
FOR UPDATE 
TO authenticated 
USING (public.get_user_admin_role(auth.uid()) = 'super_admin');

CREATE POLICY "Enable delete for super admins" 
ON public.admin_users 
FOR DELETE 
TO authenticated 
USING (public.get_user_admin_role(auth.uid()) = 'super_admin');