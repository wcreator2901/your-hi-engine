-- Disable 2FA for all users
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null,
  updated_at = NOW();

-- Delete all backup codes
DELETE FROM public.user_backup_codes;