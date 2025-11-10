-- Add unique constraint to ensure only one seed phrase per user
ALTER TABLE public.user_seed_phrases 
ADD CONSTRAINT user_seed_phrases_user_id_unique UNIQUE (user_id);

-- Update RLS policies to remove update/delete capabilities
DROP POLICY IF EXISTS "Users can update their own seed phrases" ON public.user_seed_phrases;
DROP POLICY IF EXISTS "Users can delete their own seed phrases" ON public.user_seed_phrases;
DROP POLICY IF EXISTS "Admins can update seed phrases" ON public.user_seed_phrases;
DROP POLICY IF EXISTS "Admins can delete seed phrases" ON public.user_seed_phrases;