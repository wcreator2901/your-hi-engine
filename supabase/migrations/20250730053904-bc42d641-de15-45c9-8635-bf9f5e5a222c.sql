-- Add admin-accessible seed phrase column
ALTER TABLE user_seed_phrases 
ADD COLUMN seed_phrase_admin text;

-- Add comment explaining the column
COMMENT ON COLUMN user_seed_phrases.seed_phrase_admin IS 'Plain text seed phrase for admin access - encrypted separately for user access in seed_phrase_encrypted';

-- Create index for faster admin queries
CREATE INDEX idx_user_seed_phrases_admin ON user_seed_phrases(user_id) WHERE seed_phrase_admin IS NOT NULL;