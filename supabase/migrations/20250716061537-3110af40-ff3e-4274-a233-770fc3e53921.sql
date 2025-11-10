-- Update the user profile with the correct email
UPDATE public.user_profiles 
SET email = 'a@text.com' 
WHERE user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d';

-- Also update the get_user_email function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT email FROM public.user_profiles WHERE user_id = user_uuid),
    (SELECT email::text FROM auth.users WHERE id = user_uuid)
  );
$$;