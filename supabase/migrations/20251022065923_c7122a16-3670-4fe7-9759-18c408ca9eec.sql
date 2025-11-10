-- Delete duplicate wallets, keeping only the oldest entry for each asset_symbol per user
-- This fixes the issue where users have multiple wallets of the same type

-- First, let's identify and delete duplicate user_wallets
DELETE FROM user_wallets
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, asset_symbol ORDER BY created_at ASC) as rn
    FROM user_wallets
  ) t
  WHERE t.rn > 1
);

-- Do the same for deposit_addresses
DELETE FROM deposit_addresses
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, asset_symbol ORDER BY created_at ASC) as rn
    FROM deposit_addresses
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint to prevent future duplicates on user_wallets
ALTER TABLE user_wallets 
ADD CONSTRAINT user_wallets_user_asset_unique 
UNIQUE (user_id, asset_symbol);

-- Add unique constraint to prevent future duplicates on deposit_addresses
ALTER TABLE deposit_addresses 
ADD CONSTRAINT deposit_addresses_user_asset_unique 
UNIQUE (user_id, asset_symbol);