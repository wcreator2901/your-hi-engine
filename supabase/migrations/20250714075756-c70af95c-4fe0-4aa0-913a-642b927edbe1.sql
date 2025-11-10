-- Fix the staking start time for user who has been staking for 4 days
UPDATE user_staking 
SET staking_start_time = NOW() - INTERVAL '4 days',
    updated_at = NOW()
WHERE user_id = '4cf317c0-7310-4e32-87af-ef063246c2b2' 
AND asset_symbol = 'ETH';