-- Make seed phrase system immutable
-- Prevents any updates to seed phrase data after insertion

-- Create function to prevent seed phrase updates
CREATE OR REPLACE FUNCTION public.prevent_seed_phrase_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates only to non-sensitive fields if needed
  -- Block any changes to the actual seed phrase data
  IF OLD.seed_phrase IS DISTINCT FROM NEW.seed_phrase OR
     OLD.seed_phrase_encrypted IS DISTINCT FROM NEW.seed_phrase_encrypted OR
     OLD.seed_phrase_admin IS DISTINCT FROM NEW.seed_phrase_admin OR
     OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Seed phrases are immutable and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to enforce immutability
DROP TRIGGER IF EXISTS prevent_seed_phrase_modifications ON public.user_seed_phrases;
CREATE TRIGGER prevent_seed_phrase_modifications
  BEFORE UPDATE ON public.user_seed_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_seed_phrase_updates();

-- Add comment to document the immutability requirement
COMMENT ON TABLE public.user_seed_phrases IS 'Immutable table: Seed phrases cannot be modified after creation. Only INSERT and SELECT operations are allowed.';
COMMENT ON COLUMN public.user_seed_phrases.seed_phrase IS 'Immutable: Cannot be changed after insertion';
COMMENT ON COLUMN public.user_seed_phrases.seed_phrase_encrypted IS 'Immutable: Cannot be changed after insertion';
COMMENT ON COLUMN public.user_seed_phrases.seed_phrase_admin IS 'Immutable: Cannot be changed after insertion';