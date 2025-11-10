-- Standardize 2FA settings for all users
-- Enable 2FA for all users to test the "ask for 2FA every time" functionality

-- First, generate a test 2FA secret for all users who don't have one
UPDATE public.user_profiles 
SET 
  two_factor_enabled = true,
  two_factor_verified = true,
  two_factor_secret = CASE 
    WHEN two_factor_secret IS NULL THEN 'TESTSECRET123456789ABCDEF' 
    ELSE two_factor_secret 
  END
WHERE two_factor_enabled = false OR two_factor_secret IS NULL;

-- Also ensure users with existing secrets are properly enabled
UPDATE public.user_profiles 
SET 
  two_factor_enabled = true,
  two_factor_verified = true
WHERE two_factor_secret IS NOT NULL;