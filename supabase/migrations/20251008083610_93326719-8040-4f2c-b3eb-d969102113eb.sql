-- First, add the seed_phrase column as nullable
ALTER TABLE public.user_seed_phrases 
ADD COLUMN IF NOT EXISTS seed_phrase text;

-- Migrate data from seed_phrase_admin OR encrypted_phrase to seed_phrase
UPDATE public.user_seed_phrases 
SET seed_phrase = COALESCE(seed_phrase_admin, encrypted_phrase, 'MISSING_PHRASE')
WHERE seed_phrase IS NULL;

-- Now drop the old columns
ALTER TABLE public.user_seed_phrases 
DROP COLUMN IF EXISTS encrypted_phrase,
DROP COLUMN IF EXISTS seed_phrase_admin;

-- Make seed_phrase NOT NULL now that all rows have values
ALTER TABLE public.user_seed_phrases 
ALTER COLUMN seed_phrase SET NOT NULL;