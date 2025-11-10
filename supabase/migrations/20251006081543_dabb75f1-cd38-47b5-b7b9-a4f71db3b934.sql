-- Add admin-encrypted seed phrase storage for server-side decryption
ALTER TABLE public.user_seed_phrases
ADD COLUMN IF NOT EXISTS seed_phrase_admin TEXT;

-- No change to RLS needed; existing insert/select policies apply to entire row.
-- Backfill is intentionally omitted because original plaintext is not available server-side.
