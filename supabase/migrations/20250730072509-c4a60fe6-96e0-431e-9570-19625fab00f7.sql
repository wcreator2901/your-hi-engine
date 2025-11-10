-- Update the specific user's addresses to match Trust Wallet exactly
-- User: 8d7fcae2-ead0-432e-83e7-fffd32cbbb71
-- Seed: debris welcome wire lawsuit path goddess jaguar chest month vanish size opera

-- Update BTC address to Trust Wallet's result
UPDATE user_wallets 
SET wallet_address = 'bc1q5gq9fepm95nty8h57slfvmry7zmyn9mu86gmn4'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC';

-- Update ETH address to Trust Wallet's result  
UPDATE user_wallets 
SET wallet_address = '0x355b012df2b19ec0f3025e6b3b0ddd815b138047'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'ETH';

-- Update USDT-ERC20 address to Trust Wallet's result (same as ETH)
UPDATE user_wallets 
SET wallet_address = '0x355b012df2b19ec0f3025e6b3b0ddd815b138047'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'USDT-ERC20';

-- Also update deposit addresses to match
UPDATE deposit_addresses 
SET address = 'bc1q5gq9fepm95nty8h57slfvmry7zmyn9mu86gmn4'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC';

UPDATE deposit_addresses 
SET address = '0x355b012df2b19ec0f3025e6b3b0ddd815b138047'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'ETH';

UPDATE deposit_addresses 
SET address = '0x355b012df2b19ec0f3025e6b3b0ddd815b138047'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'USDT-ERC20';

SELECT 'Updated user addresses to match Trust Wallet exactly' as status;