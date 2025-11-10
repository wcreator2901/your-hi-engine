-- Make secret column nullable since we use secret_encrypted for storage
ALTER TABLE public.user_2fa
ALTER COLUMN secret DROP NOT NULL;