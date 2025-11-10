-- Check if user exists and create profile with email
INSERT INTO public.user_profiles (user_id, email, full_name, username)
SELECT 
  au.id as user_id,
  au.email,
  au.raw_user_meta_data ->> 'full_name' as full_name,
  au.raw_user_meta_data ->> 'username' as username
FROM auth.users au 
WHERE au.id = '6ab9c964-6cca-447b-883f-f66ff7a9f1d4'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = au.id
  );