-- Reset all 2FA settings for all users
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null;

-- Delete all existing backup codes
DELETE FROM public.user_backup_codes;