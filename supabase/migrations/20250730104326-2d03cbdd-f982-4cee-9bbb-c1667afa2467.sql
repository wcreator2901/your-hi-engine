-- *** COMPLETE REMOVAL OF ALL BTC LOGIC FROM DATABASE ***
-- Remove all BTC-related wallet entries
DELETE FROM user_wallets WHERE asset_symbol = 'BTC';

-- Remove all BTC-related deposit addresses  
DELETE FROM deposit_addresses WHERE asset_symbol = 'BTC';

-- Remove all BTC-related transactions
DELETE FROM user_transactions WHERE asset_symbol = 'BTC';

-- Remove all BTC-related default wallets
DELETE FROM default_wallets WHERE asset_symbol = 'BTC';

-- Remove all BTC-related bank accounts (if any reference BTC transactions)
DELETE FROM bank_accounts WHERE transaction_id IN (
    SELECT id FROM user_transactions WHERE asset_symbol = 'BTC'
);

-- Add constraints to prevent BTC from being added again
ALTER TABLE user_wallets ADD CONSTRAINT no_btc_wallets CHECK (asset_symbol != 'BTC');
ALTER TABLE deposit_addresses ADD CONSTRAINT no_btc_deposits CHECK (asset_symbol != 'BTC');
ALTER TABLE user_transactions ADD CONSTRAINT no_btc_transactions CHECK (asset_symbol != 'BTC');
ALTER TABLE default_wallets ADD CONSTRAINT no_btc_defaults CHECK (asset_symbol != 'BTC');