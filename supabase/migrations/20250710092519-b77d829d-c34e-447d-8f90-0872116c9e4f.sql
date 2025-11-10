-- Add admin-controlled 2FA requirement column
ALTER TABLE public.user_profiles 
ADD COLUMN two_factor_required boolean DEFAULT false;

-- Create function to toggle 2FA requirement for users (admin only)
CREATE OR REPLACE FUNCTION public.toggle_user_2fa_requirement(target_user_id uuid, required boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT check_user_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update the 2FA requirement for the target user
  UPDATE public.user_profiles 
  SET 
    two_factor_required = required,
    -- If disabling requirement, also disable 2FA
    two_factor_enabled = CASE WHEN required = false THEN false ELSE two_factor_enabled END,
    two_factor_verified = CASE WHEN required = false THEN false ELSE two_factor_verified END,
    two_factor_secret = CASE WHEN required = false THEN NULL ELSE two_factor_secret END,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- If disabling requirement, delete backup codes
  IF required = false THEN
    DELETE FROM public.user_backup_codes WHERE user_id = target_user_id;
  END IF;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;