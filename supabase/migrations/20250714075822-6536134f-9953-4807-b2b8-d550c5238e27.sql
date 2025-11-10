-- Clean up duplicate records and add unique constraint
-- First, keep only the most recent record for each user/asset combination
DELETE FROM user_staking 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, asset_symbol) id
    FROM user_staking
    ORDER BY user_id, asset_symbol, updated_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_staking 
ADD CONSTRAINT user_staking_user_id_asset_symbol_unique 
UNIQUE (user_id, asset_symbol);

-- Update the remaining record to have the correct 4-day staking period
UPDATE user_staking 
SET staking_start_time = NOW() - INTERVAL '4 days',
    updated_at = NOW()
WHERE user_id = '4cf317c0-7310-4e32-87af-ef063246c2b2' 
AND asset_symbol = 'ETH';