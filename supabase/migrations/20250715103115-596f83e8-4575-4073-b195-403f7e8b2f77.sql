-- Refresh schema cache by recreating the constraint
ALTER TABLE public.user_seed_phrases DROP CONSTRAINT IF EXISTS user_seed_phrases_user_id_fkey;
ALTER TABLE public.user_seed_phrases ADD CONSTRAINT user_seed_phrases_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure the column has proper defaults
ALTER TABLE public.user_seed_phrases 
  ALTER COLUMN encrypted_seed_phrase SET DEFAULT '';

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';