-- Remove all 2FA functionality from the database

-- Drop the user_seed_phrases table entirely
DROP TABLE IF EXISTS public.user_seed_phrases;

-- Remove 2FA columns from user_profiles table
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS two_factor_enabled,
DROP COLUMN IF EXISTS two_factor_required,
DROP COLUMN IF EXISTS two_factor_verified;