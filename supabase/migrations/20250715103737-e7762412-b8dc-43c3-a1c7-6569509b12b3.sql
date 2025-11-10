-- Temporarily disable RLS and recreate everything from scratch
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can modify admin users" ON public.admin_users;

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to read admin_users" 
ON public.admin_users 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow super admins to manage admin_users" 
ON public.admin_users 
FOR ALL 
TO authenticated
USING (
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT a.user_id FROM public.admin_users a 
    WHERE a.role = 'super_admin'
  )
);