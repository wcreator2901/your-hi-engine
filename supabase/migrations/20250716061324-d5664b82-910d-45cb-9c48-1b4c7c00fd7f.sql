-- Add email column to user_profiles table to store user emails
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create a function to get user email from auth metadata
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email::text 
  FROM auth.users 
  WHERE id = user_uuid;
$$;

-- Update existing user profiles with emails if possible
-- Note: This will work for existing users who have email in auth.users