-- Clean up deposit addresses and sync with HD wallets
DELETE FROM deposit_addresses;

-- Insert deposit addresses that match the HD wallet addresses
INSERT INTO deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT 
  user_id,
  asset_symbol,
  wallet_address,
  'mainnet' as network,
  true as is_active
FROM user_wallets 
WHERE is_hd_wallet = true;