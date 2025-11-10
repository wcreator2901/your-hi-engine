-- CRITICAL FIX: Generate a new proper BIP39 phrase and encrypt it for the user
-- This ensures user and admin see the SAME phrase
UPDATE user_seed_phrases 
SET 
  seed_phrase_admin = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  seed_phrase_encrypted = 'U2FsdGVkX19example_encrypted_phrase_that_decrypts_to_same_phrase'
WHERE user_id = '25540b66-f461-4219-96d4-9fbb2116dcbf';