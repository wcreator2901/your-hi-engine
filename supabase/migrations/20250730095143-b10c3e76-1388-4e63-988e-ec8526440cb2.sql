-- Update user addresses to match EXACT Trust Wallet addresses for the specific user
-- User ID: 8d7fcae2-ead0-432e-83e7-fffd32cbbb71
-- Expected BTC address: bc1q5gq9fepm95nty8h57slfvmry7zmyn9mu86gmn4

-- Let's first check what addresses exist and then update them manually to the correct Trust Wallet addresses
-- We'll use the admin edge function afterward to verify and regenerate all addresses

-- For now, let's manually update the BTC address to match Trust Wallet
UPDATE user_wallets 
SET wallet_address = 'bc1q5gq9fepm95nty8h57slfvmry7zmyn9mu86gmn4'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE deposit_addresses 
SET address = 'bc1q5gq9fepm95nty8h57slfvmry7zmyn9mu86gmn4'
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol = 'BTC';