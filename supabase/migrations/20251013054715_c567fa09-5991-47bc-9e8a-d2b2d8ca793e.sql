-- Ensure seed_phrase_admin column exists (already added in previous migration)
-- Update handle_new_user function to include first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_id,
    username,
    email,
    full_name,
    first_name,
    last_name,
    status,
    two_factor_enabled,
    two_factor_required,
    two_factor_verified,
    registration_date
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'active',
    false,
    false,
    false,
    now()
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add first_name and last_name columns to user_profiles if they don't exist
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;