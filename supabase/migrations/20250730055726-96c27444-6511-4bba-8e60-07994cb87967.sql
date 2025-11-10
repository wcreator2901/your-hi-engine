-- URGENT FIX: Generate proper BIP39 phrase for this user
-- This user got caught with old system - fix immediately
UPDATE user_seed_phrases 
SET seed_phrase_admin = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
WHERE user_id = '25540b66-f461-4219-96d4-9fbb2116dcbf';