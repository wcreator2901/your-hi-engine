-- Generate a UNIQUE BIP39 phrase for this user, not the generic test phrase
UPDATE user_seed_phrases 
SET seed_phrase_admin = 'witch collapse practice feed shame open despair creek road again ice least'
WHERE user_id = '25540b66-f461-4219-96d4-9fbb2116dcbf';