-- Update the check_user_is_admin function to use the new secure user_roles table
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'admin'
  )
$$;