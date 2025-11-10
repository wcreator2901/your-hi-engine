-- Update BTC address to match Trust Wallet exactly
-- For the mnemonic: robot raise fatigue desert tattoo merge rotate speak now bridge velvet near
-- Correct Trust Wallet BTC address: bc1q9ch359ux002tat2c5vrq90vn3ljz9jmn8hrunq

UPDATE user_wallets 
SET wallet_address = 'bc1q9ch359ux002tat2c5vrq90vn3ljz9jmn8hrunq'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'robot raise fatigue desert tattoo merge rotate speak now bridge velvet near' LIMIT 1)
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE deposit_addresses 
SET address = 'bc1q9ch359ux002tat2c5vrq90vn3ljz9jmn8hrunq'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'robot raise fatigue desert tattoo merge rotate speak now bridge velvet near' LIMIT 1)
AND asset_symbol = 'BTC';