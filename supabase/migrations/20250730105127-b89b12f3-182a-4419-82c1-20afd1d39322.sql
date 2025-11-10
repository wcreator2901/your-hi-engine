-- Remove BTC constraints and test with user's seed phrase
-- Remove constraints that block BTC
ALTER TABLE user_wallets DROP CONSTRAINT IF EXISTS no_btc_wallets;
ALTER TABLE deposit_addresses DROP CONSTRAINT IF EXISTS no_btc_deposits;
ALTER TABLE user_transactions DROP CONSTRAINT IF EXISTS no_btc_transactions;
ALTER TABLE default_wallets DROP CONSTRAINT IF EXISTS no_btc_defaults;

-- Create BTC wallet and deposit address for user f08c2ced-4f28-432e-a045-1c2534b5aff2
-- Seed: "define three victory ghost boss unusual sting noise hub install woman candy"
-- Expected Trust Wallet address: bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr

INSERT INTO user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active, is_hd_wallet, derivation_path, address_index)
VALUES ('f08c2ced-4f28-432e-a045-1c2534b5aff2', 'BTC', 'Bitcoin Wallet', 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr', 0, 0, true, true, 'm/84''/0''/0''/0/0', 0)
ON CONFLICT (user_id, asset_symbol) DO UPDATE SET 
  wallet_address = 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr',
  derivation_path = 'm/84''/0''/0''/0/0';

INSERT INTO deposit_addresses (user_id, asset_symbol, address, network, is_active)
VALUES ('f08c2ced-4f28-432e-a045-1c2534b5aff2', 'BTC', 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr', 'bitcoin', true)
ON CONFLICT (user_id, asset_symbol) DO UPDATE SET 
  address = 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr';