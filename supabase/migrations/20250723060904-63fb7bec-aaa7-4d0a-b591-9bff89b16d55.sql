-- Remove all seed phrase and 2FA related database objects that are causing errors

-- Drop the table if it exists (it's referenced in queries but doesn't exist)
DROP TABLE IF EXISTS public.user_seed_phrases CASCADE;

-- Drop any recovery phrase tables if they exist
DROP TABLE IF EXISTS public.user_recovery_phrases CASCADE;

-- Remove 2FA columns from user_profiles if they exist (causing column errors)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS two_factor_required;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS two_factor_secret;