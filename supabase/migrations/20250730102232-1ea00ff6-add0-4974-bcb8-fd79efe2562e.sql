-- Update BTC address to match Trust Wallet exactly
-- For the mnemonic: transfer away cement shaft way famous whale merge prize receive master zone
-- Correct Trust Wallet BTC address: bc1qcg96tvlvkw9x2zp4ler047wpmemrjkjcru6yxt

UPDATE user_wallets 
SET wallet_address = 'bc1qcg96tvlvkw9x2zp4ler047wpmemrjkjcru6yxt'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'transfer away cement shaft way famous whale merge prize receive master zone' LIMIT 1)
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE deposit_addresses 
SET address = 'bc1qcg96tvlvkw9x2zp4ler047wpmemrjkjcru6yxt'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'transfer away cement shaft way famous whale merge prize receive master zone' LIMIT 1)
AND asset_symbol = 'BTC';