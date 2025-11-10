-- Update BTC address to match Trust Wallet exactly
-- For the mnemonic: leopard stick stool fee verb notice kiwi assume shock dust oyster state
-- Correct Trust Wallet BTC address: bc1ql48fpcgk3asgk49nj7nszdazzwgmhl4lwly8w9

UPDATE user_wallets 
SET wallet_address = 'bc1ql48fpcgk3asgk49nj7nszdazzwgmhl4lwly8w9'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'leopard stick stool fee verb notice kiwi assume shock dust oyster state' LIMIT 1)
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE deposit_addresses 
SET address = 'bc1ql48fpcgk3asgk49nj7nszdazzwgmhl4lwly8w9'
WHERE user_id = (SELECT user_id FROM user_seed_phrases WHERE seed_phrase_admin = 'leopard stick stool fee verb notice kiwi assume shock dust oyster state' LIMIT 1)
AND asset_symbol = 'BTC';