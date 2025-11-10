-- Add missing columns required by totp-2fa edge function
-- Ensure we only add what is necessary and remain backward-compatible

-- 1) Add encrypted secret column
ALTER TABLE public.user_2fa
ADD COLUMN IF NOT EXISTS secret_encrypted text;

-- 2) Add backup codes (hashed) storage column
ALTER TABLE public.user_2fa
ADD COLUMN IF NOT EXISTS backup_codes text[];

-- Optional: keep existing RLS; no policy changes needed since service role bypasses RLS
-- Optional: Add an index to speed up lookups by user_id used in the function
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa (user_id);
