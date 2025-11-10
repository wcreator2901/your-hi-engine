-- Backfill created_at from registration_date where missing
UPDATE public.user_profiles
SET created_at = registration_date
WHERE created_at IS NULL AND registration_date IS NOT NULL;

-- Backfill last_login from auth.users.last_sign_in_at for existing users
UPDATE public.user_profiles p
SET last_login = u.last_sign_in_at
FROM auth.users u
WHERE p.user_id = u.id
  AND p.last_login IS NULL
  AND u.last_sign_in_at IS NOT NULL;

-- Ensure registration_date is set if missing but created_at exists
UPDATE public.user_profiles
SET registration_date = created_at
WHERE registration_date IS NULL AND created_at IS NOT NULL;