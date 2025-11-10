-- Fix the user_seed_phrases table by adding the missing encrypted_seed_phrase column
ALTER TABLE public.user_seed_phrases 
ADD COLUMN IF NOT EXISTS encrypted_seed_phrase text NOT NULL DEFAULT '';