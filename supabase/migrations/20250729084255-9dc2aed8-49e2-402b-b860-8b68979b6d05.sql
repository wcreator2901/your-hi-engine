-- Add online tracking fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN online_duration NUMERIC DEFAULT 0;

-- Create index for better performance on online status queries
CREATE INDEX idx_user_profiles_last_seen ON public.user_profiles(last_seen);
CREATE INDEX idx_user_profiles_is_online ON public.user_profiles(is_online);

-- Create function to update last seen time
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.last_seen = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update last_seen on any profile update
CREATE TRIGGER update_user_profiles_last_seen
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_last_seen();

-- Function to mark user as online/offline
CREATE OR REPLACE FUNCTION public.set_user_online_status(p_user_id uuid, p_is_online boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.user_profiles 
  SET 
    is_online = p_is_online,
    last_seen = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;