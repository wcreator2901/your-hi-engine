-- Create function to disable 2FA for a user (admin only)
CREATE OR REPLACE FUNCTION disable_user_2fa(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT check_user_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Disable 2FA for the target user
  UPDATE public.user_profiles 
  SET 
    two_factor_enabled = FALSE,
    two_factor_verified = FALSE,
    two_factor_secret = NULL,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Delete any existing backup codes for the user
  DELETE FROM public.user_backup_codes WHERE user_id = target_user_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;