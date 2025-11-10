-- Update BTC address to match Trust Wallet exactly
-- For user: 8d7fcae2-ead0-432e-83e7-fffd32cbbb71
-- Correct Trust Wallet address: bc1qgf0x5f70yj56vqnsrgvpvj8q62pne99wjjrcua

UPDATE user_wallets 
SET wallet_address = 'bc1qgf0x5f70yj56vqnsrgvpvj8q62pne99wjjrcua'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE deposit_addresses 
SET address = 'bc1qgf0x5f70yj56vqnsrgvpvj8q62pne99wjjrcua'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC';