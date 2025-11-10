-- First, update user_profiles table to match the complete system
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS registration_date timestamp with time zone DEFAULT now();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    user_id,
    username,
    email,
    full_name,
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'active',
    false,
    false,
    false,
    now()
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually create the missing profile for the current admin user
INSERT INTO public.user_profiles (
  id,
  user_id,
  username,
  email,
  full_name,
  status,
  two_factor_enabled,
  two_factor_required,
  two_factor_verified,
  registration_date
)
SELECT 
  gen_random_uuid(),
  au.id,
  SPLIT_PART(au.email, '@', 1),
  au.email,
  SPLIT_PART(au.email, '@', 1),
  'active',
  false,
  false,
  false,
  au.created_at
FROM auth.users au
WHERE au.id = '46f9b35f-99c8-401c-9ede-0630ae474ceb'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = au.id
  );

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create RLS policies for admin access
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (check_user_is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (check_user_is_admin());