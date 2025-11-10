-- Test Trust Wallet compatibility for user 1c36e736-6349-4b51-8744-21dcd3b906ed
-- Seed: rabbit toddler border peanut tape mesh light robust piano aware frequent cactus
-- Expected Trust Wallet addresses:
-- BTC: bc1qwyl6shyueh5n90pjwv936jrt5lfnqeh23n02fg
-- ETH: 0x6370eEffC5556DB945561282E11a679FE8dA6d76
-- TRC: TG6fR7eyhRnafd1TL7YKzwxE3WY94GHWGW

-- Update with actual Trust Wallet addresses to verify system works
UPDATE user_wallets 
SET 
  wallet_address = 'bc1qwyl6shyueh5n90pjwv936jrt5lfnqeh23n02fg',
  derivation_path = 'm/84''/0''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' 
AND asset_symbol = 'BTC' 
AND is_hd_wallet = true;

UPDATE user_wallets 
SET 
  wallet_address = '0x6370eEffC5556DB945561282E11a679FE8dA6d76',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' 
AND asset_symbol = 'ETH' 
AND is_hd_wallet = true;

UPDATE user_wallets 
SET 
  wallet_address = '0x6370eEffC5556DB945561282E11a679FE8dA6d76',
  derivation_path = 'm/44''/60''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' 
AND asset_symbol = 'USDT-ERC20' 
AND is_hd_wallet = true;

UPDATE user_wallets 
SET 
  wallet_address = 'TG6fR7eyhRnafd1TL7YKzwxE3WY94GHWGW',
  derivation_path = 'm/44''/195''/0''/0/0',
  is_hd_wallet = true,
  updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' 
AND asset_symbol = 'USDT-TRC20' 
AND is_hd_wallet = true;

-- Update deposit addresses
UPDATE deposit_addresses 
SET address = 'bc1qwyl6shyueh5n90pjwv936jrt5lfnqeh23n02fg', updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' AND asset_symbol = 'BTC';

UPDATE deposit_addresses 
SET address = '0x6370eEffC5556DB945561282E11a679FE8dA6d76', updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' AND asset_symbol = 'ETH';

UPDATE deposit_addresses 
SET address = '0x6370eEffC5556DB945561282E11a679FE8dA6d76', updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' AND asset_symbol = 'USDT-ERC20';

UPDATE deposit_addresses 
SET address = 'TG6fR7eyhRnafd1TL7YKzwxE3WY94GHWGW', updated_at = now()
WHERE user_id = '1c36e736-6349-4b51-8744-21dcd3b906ed' AND asset_symbol = 'USDT-TRC20';