-- Update default_wallets table to only include Trust Wallet standard assets
-- First delete any non-standard assets
DELETE FROM default_wallets 
WHERE asset_symbol NOT IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');

-- Update wallet names to be cleaner and consistent
UPDATE default_wallets 
SET wallet_name = CASE 
  WHEN asset_symbol = 'BTC' THEN 'Bitcoin Wallet'
  WHEN asset_symbol = 'ETH' THEN 'Ethereum Wallet'  
  WHEN asset_symbol = 'USDT-ERC20' THEN 'USDT (ERC20) Wallet'
  WHEN asset_symbol = 'USDT-TRC20' THEN 'USDT (TRC20) Wallet'
  ELSE wallet_name
END
WHERE asset_symbol IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');

-- Ensure we have the 4 standard wallets (insert if missing)
INSERT INTO default_wallets (asset_symbol, wallet_name, wallet_address, created_by) 
SELECT 
  asset_symbol,
  wallet_name,
  'PLACEHOLDER_' || asset_symbol,
  (SELECT user_id FROM admin_users WHERE role = 'super_admin' LIMIT 1)
FROM (
  VALUES 
    ('BTC', 'Bitcoin Wallet'),
    ('ETH', 'Ethereum Wallet'),
    ('USDT-ERC20', 'USDT (ERC20) Wallet'),
    ('USDT-TRC20', 'USDT (TRC20) Wallet')
) AS new_wallets(asset_symbol, wallet_name)
WHERE NOT EXISTS (
  SELECT 1 FROM default_wallets 
  WHERE default_wallets.asset_symbol = new_wallets.asset_symbol
);

-- Clean up any extra wallets/addresses for ALL users to maintain Trust Wallet standard
DELETE FROM user_wallets 
WHERE asset_symbol NOT IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');

DELETE FROM deposit_addresses 
WHERE asset_symbol NOT IN ('BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20');