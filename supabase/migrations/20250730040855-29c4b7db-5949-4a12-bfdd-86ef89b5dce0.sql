-- Fix the search path security issue for the new function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
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
$$;