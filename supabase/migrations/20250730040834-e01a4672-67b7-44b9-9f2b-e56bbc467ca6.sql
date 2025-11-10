-- Create the missing user profile
INSERT INTO public.user_profiles (user_id, email, username, display_name, full_name, created_at, updated_at)
VALUES (
  '8d0fda5d-9431-4e74-bae5-d0a27ef4432d',
  'ab@test.com',
  'ab@test.com',
  'ab@test.com',
  'ab@test.com',
  '2025-07-30 04:04:28.906283+00',
  now()
);

-- Create a function to automatically create user profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, username, display_name, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();