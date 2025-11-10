-- Clean up existing TRC20 data from user wallets
DELETE FROM user_wallets 
WHERE asset_symbol = 'USDT-TRC20';

-- Clean up TRC20 deposit addresses
DELETE FROM deposit_addresses 
WHERE asset_symbol = 'USDT-TRC20' OR network = 'trc20';

-- Update default wallets to remove TRC20
DELETE FROM default_wallets 
WHERE asset_symbol = 'USDT-TRC20';