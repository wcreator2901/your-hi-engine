
-- This function checks if a user is an admin
-- We'll use this from our useAuth hook
CREATE OR REPLACE FUNCTION public.check_user_is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = user_id_param 
    AND role = 'admin'
  );
$$;
