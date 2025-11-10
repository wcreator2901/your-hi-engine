-- Clean up duplicate wallets for user 8d7fcae2-ead0-432e-83e7-fffd32cbbb71
-- Keep only the HD Wallet versions and delete the old ones

DELETE FROM user_wallets 
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND wallet_name NOT LIKE '%HD Wallet%';

-- Update wallet names to be cleaner (remove "HD Wallet" suffix)
UPDATE user_wallets 
SET wallet_name = CASE 
  WHEN asset_symbol = 'BTC' THEN 'Bitcoin Wallet'
  WHEN asset_symbol = 'ETH' THEN 'Ethereum Wallet'  
  WHEN asset_symbol = 'USDT-ERC20' THEN 'USDT (ERC20) Wallet'
  WHEN asset_symbol = 'USDT-TRC20' THEN 'USDT (TRC20) Wallet'
  ELSE wallet_name
END
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND wallet_name LIKE '%HD Wallet%';

-- Ensure is_hd_wallet flag is set correctly
UPDATE user_wallets 
SET is_hd_wallet = true
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71';

-- Clean up any non-Trust Wallet standard assets (if they exist)
-- Keep only: BTC, ETH, USDT-ERC20, USDT-TRC20
DELETE FROM user_wallets 
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol NOT IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');

DELETE FROM deposit_addresses 
WHERE user_id = '8d7fcae2-ead0-432e-83e7-fffd32cbbb71' 
AND asset_symbol NOT IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');