-- Complete and thorough 2FA reset for ALL users
-- This ensures every user has a fresh 2FA experience

-- First, let's see current state and reset ALL user profiles completely
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null,
  updated_at = now();

-- Delete ALL backup codes from all users
DELETE FROM public.user_backup_codes;

-- Delete ALL recovery phrases from all users  
DELETE FROM public.user_recovery_phrases;

-- Specifically verify the user mentioned is reset
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null,
  updated_at = now()
WHERE id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2';

-- Delete any backup codes for this specific user
DELETE FROM public.user_backup_codes 
WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2';

-- Delete any recovery phrases for this specific user
DELETE FROM public.user_recovery_phrases 
WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2';

-- Log the comprehensive reset
INSERT INTO public.admin_error_logs (
  admin_user_id, 
  log_message, 
  log_type, 
  created_at
) VALUES (
  (SELECT user_id FROM public.admin_users WHERE role = 'admin' LIMIT 1),
  'Comprehensive 2FA reset performed for ALL users including user 61b5f835-bb5b-4158-9a1d-804c9b741eb2',
  'system_reset',
  now()
);