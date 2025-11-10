-- Fix the new user who got caught between old and new system
-- We need to populate their seed_phrase_admin field with a proper BIP39 phrase
UPDATE user_seed_phrases 
SET seed_phrase_admin = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
WHERE user_id = '72f1259c-1446-4a53-8bd4-99d65dfd5a71' AND seed_phrase_admin IS NULL;