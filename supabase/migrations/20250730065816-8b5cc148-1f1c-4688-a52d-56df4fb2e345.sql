-- Update addresses for user 3f589e9a-c3bb-413f-9966-dd94a416749d with Trust Wallet compatible addresses
-- Generated from seed phrase: income coast fault receive shove scout motion liberty flush brief frown employ

-- Update Bitcoin address to Trust Wallet Native SegWit format
UPDATE user_wallets 
SET 
  wallet_address = 'bc1qgqeqkhm4nwm7x86t3hwj5pz73wnxjgqx9wt9h3',
  derivation_path = 'm/84''/0''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

-- Update Ethereum address to Trust Wallet standard
UPDATE user_wallets 
SET 
  wallet_address = '0x9c9ca504f37ba1142550df7b13a17ce515f35c67',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'ETH' 
AND is_hd_wallet = true;

-- Update USDT-ERC20 address (same as ETH)
UPDATE user_wallets 
SET 
  wallet_address = '0x9c9ca504f37ba1142550df7b13a17ce515f35c67',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-ERC20' 
AND is_hd_wallet = true;

-- Update USDT-TRC20 address to Trust Wallet standard
UPDATE user_wallets 
SET 
  wallet_address = 'TRxnvnwvb6phxxtWxRiKZfT4YcHZnY9wjg',
  derivation_path = 'm/44''/195''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-TRC20' 
AND is_hd_wallet = true;

-- Update deposit addresses to match the new wallet addresses
UPDATE deposit_addresses 
SET 
  address = 'bc1qgqeqkhm4nwm7x86t3hwj5pz73wnxjgqx9wt9h3',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'BTC';

UPDATE deposit_addresses 
SET 
  address = '0x9c9ca504f37ba1142550df7b13a17ce515f35c67',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'ETH';

UPDATE deposit_addresses 
SET 
  address = '0x9c9ca504f37ba1142550df7b13a17ce515f35c67',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-ERC20';

UPDATE deposit_addresses 
SET 
  address = 'TRxnvnwvb6phxxtWxRiKZfT4YcHZnY9wjg',
  updated_at = now()
WHERE user_id = '3f589e9a-c3bb-413f-9966-dd94a416749d' 
AND asset_symbol = 'USDT-TRC20';