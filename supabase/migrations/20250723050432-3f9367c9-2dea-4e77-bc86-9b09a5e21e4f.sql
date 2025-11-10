-- Directly update the 2FA requirement for the test user
UPDATE user_profiles 
SET two_factor_required = false, 
    two_factor_enabled = false, 
    two_factor_verified = false,
    updated_at = now() 
WHERE user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d';