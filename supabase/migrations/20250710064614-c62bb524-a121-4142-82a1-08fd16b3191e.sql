-- Reset all 2FA data for all users to simulate a fresh 2FA rollout
-- This will make it appear as if 2FA is a new feature for everyone

-- Reset all user 2FA settings
UPDATE public.user_profiles 
SET 
  two_factor_enabled = false,
  two_factor_verified = false,
  two_factor_secret = null,
  updated_at = now()
WHERE 
  two_factor_enabled = true 
  OR two_factor_verified = true 
  OR two_factor_secret IS NOT NULL;

-- Delete all existing backup codes
DELETE FROM public.user_backup_codes;

-- Delete all existing recovery phrases (they're tied to 2FA setup)
DELETE FROM public.user_recovery_phrases;

-- Log the reset action
INSERT INTO public.admin_error_logs (
  admin_user_id, 
  log_message, 
  log_type, 
  created_at
) VALUES (
  (SELECT user_id FROM public.admin_users WHERE role = 'admin' LIMIT 1),
  'Mass 2FA reset performed - all users can now set up 2FA as a new feature',
  'system_reset',
  now()
);