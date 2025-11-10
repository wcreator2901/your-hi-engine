-- Remove BTC constraint that's blocking insertion
ALTER TABLE user_wallets DROP CONSTRAINT no_btc_wallets;
ALTER TABLE deposit_addresses DROP CONSTRAINT no_btc_deposits;