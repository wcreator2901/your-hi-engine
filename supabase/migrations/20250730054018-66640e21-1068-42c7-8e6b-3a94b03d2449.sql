-- Update admin accessible seed phrase for known users
UPDATE user_seed_phrases 
SET seed_phrase_admin = 'accident abandon about above absorb absurd abuse access accident achieve acid acquire'
WHERE user_id = 'ce9a4a8e-90a0-4717-94e1-7c46b7135e4a';

-- Update other known users as well  
UPDATE user_seed_phrases 
SET seed_phrase_admin = 'witch collapse practice feed shame open despair creek road again ice least'
WHERE user_id = '8d0fda5d-9431-4e74-bae5-d0a27ef4432d';

UPDATE user_seed_phrases 
SET seed_phrase_admin = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
WHERE user_id = 'b05d2185-ae4d-48b2-8801-f14e13cc908d';

UPDATE user_seed_phrases 
SET seed_phrase_admin = 'legal winner thank year wave sausage worth useful legal winner thank yellow'
WHERE user_id = 'a13a6b71-d433-41aa-b752-34f887f06b7e';