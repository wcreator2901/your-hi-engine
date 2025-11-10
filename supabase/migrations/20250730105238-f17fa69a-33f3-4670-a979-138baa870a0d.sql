-- Insert BTC data for user f08c2ced-4f28-432e-a045-1c2534b5aff2 with Trust Wallet address
INSERT INTO user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active, is_hd_wallet, derivation_path, address_index)
VALUES ('f08c2ced-4f28-432e-a045-1c2534b5aff2', 'BTC', 'Bitcoin Wallet', 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr', 0, 0, true, true, 'm/84''/0''/0''/0/0', 0);

INSERT INTO deposit_addresses (user_id, asset_symbol, address, network, is_active)
VALUES ('f08c2ced-4f28-432e-a045-1c2534b5aff2', 'BTC', 'bc1quz54297h65vxgheg57d7d7adc7qk8s0zt8cgjr', 'bitcoin', true);