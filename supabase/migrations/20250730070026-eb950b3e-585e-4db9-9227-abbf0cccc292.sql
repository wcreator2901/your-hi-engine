-- Update addresses for user 3f589e9a-c3bb-413f-9966-dd94a416749d with actual Trust Wallet addresses
-- BTC: bc1quymzxl9g4n8p4u70refv0dyv5tzuut8ujsku06
-- ETH: 0x5Cca29a5c8F5D0a240cFD91b93c2293A29441847  
-- TRC: TQfi3wF8Vkb9pmar2bFaQqXaMBWnQq2sMv

-- Update Bitcoin address to actual Trust Wallet address
UPDATE user_wallets 
SET 
  wallet_address = 'bc1quymzxl9g4n8p4u70refv0dyv5tzuut8ujsku06',
  derivation_path = 'm/84''/0''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

-- Update Ethereum address to actual Trust Wallet address
UPDATE user_wallets 
SET 
  wallet_address = '0x5Cca29a5c8F5D0a240cFD91b93c2293A29441847',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'ETH' 
AND is_hd_wallet = true;

-- Update USDT-ERC20 address (same as ETH)
UPDATE user_wallets 
SET 
  wallet_address = '0x5Cca29a5c8F5D0a240cFD91b93c2293A29441847',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-ERC20' 
AND is_hd_wallet = true;

-- Update USDT-TRC20 address to actual Trust Wallet address
UPDATE user_wallets 
SET 
  wallet_address = 'TQfi3wF8Vkb9pmar2bFaQqXaMBWnQq2sMv',
  derivation_path = 'm/44''/195''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-TRC20' 
AND is_hd_wallet = true;

-- Update deposit addresses to match the actual Trust Wallet addresses
UPDATE deposit_addresses 
SET 
  address = 'bc1quymzxl9g4n8p4u70refv0dyv5tzuut8ujsku06',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'BTC';

UPDATE deposit_addresses 
SET 
  address = '0x5Cca29a5c8F5D0a240cFD91b93c2293A29441847',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'ETH';

UPDATE deposit_addresses 
SET 
  address = '0x5Cca29a5c8F5D0a240cFD91b93c2293A29441847',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-ERC20';

UPDATE deposit_addresses 
SET 
  address = 'TQfi3wF8Vkb9pmar2bFaQqXaMBWnQq2sMv',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-TRC20';