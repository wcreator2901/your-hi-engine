-- Delete old non-HD wallets (keep only the new HD wallets that match Atomic Wallet)
DELETE FROM user_wallets 
WHERE is_hd_wallet = false OR derivation_path IS NULL;

-- Also clean up corresponding deposit addresses for old wallets
DELETE FROM deposit_addresses 
WHERE address IN (
  SELECT wallet_address 
  FROM user_wallets 
  WHERE is_hd_wallet = false OR derivation_path IS NULL
);

-- Update deposit addresses to match the HD wallet addresses
INSERT INTO deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT DISTINCT 
  user_id,
  asset_symbol,
  wallet_address,
  'mainnet' as network,
  true as is_active
FROM user_wallets 
WHERE is_hd_wallet = true
ON CONFLICT (user_id, asset_symbol, address) DO NOTHING;