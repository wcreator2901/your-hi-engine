-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    status,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'active',
    'user'
  );

  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually create profile for existing user without one
INSERT INTO public.user_profiles (
  user_id,
  email,
  status,
  role
)
SELECT 
  id,
  email,
  'active',
  'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;