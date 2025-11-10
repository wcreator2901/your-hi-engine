-- Update user_profiles table to ensure first_name and last_name columns exist
-- and add them if they don't exist

-- Check if columns exist and add them if needed
DO $$ 
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN first_name TEXT;
    END IF;
    
    -- Add last_name column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- Create or replace the handle_new_user_profile function to include first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    username, 
    display_name, 
    full_name,
    first_name,
    last_name,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 
             CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
             NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name',
             CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
             NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.created_at
  );
  RETURN NEW;
END;
$function$;