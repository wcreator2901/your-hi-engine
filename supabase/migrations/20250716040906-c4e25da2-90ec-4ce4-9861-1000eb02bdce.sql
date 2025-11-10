-- Insert user profiles for existing auth users
INSERT INTO public.user_profiles (user_id, username, full_name, display_name)
SELECT 
  id as user_id,
  COALESCE(split_part(email, '@', 1), 'user') as username,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)) as display_name
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles);