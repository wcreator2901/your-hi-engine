-- Completely reset 2FA for the two specific users mentioned
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null
WHERE id IN ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', '246b0d62-3a19-4a81-9b41-f67ec6d72c0d');

-- Delete all backup codes for these users
DELETE FROM public.user_backup_codes 
WHERE user_id IN ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', '246b0d62-3a19-4a81-9b41-f67ec6d72c0d');