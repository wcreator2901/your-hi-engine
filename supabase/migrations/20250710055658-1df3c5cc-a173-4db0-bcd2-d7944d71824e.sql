-- Enable 2FA for user 246b0d62-3a19-4a81-9b41-f67ec6d72c0d for testing
-- First, let's check the current 2FA status
SELECT id, two_factor_enabled, two_factor_verified, two_factor_secret IS NOT NULL as has_secret 
FROM public.user_profiles 
WHERE id = '246b0d62-3a19-4a81-9b41-f67ec6d72c0d';