-- Force update the staking start time to exactly 4 days ago
UPDATE user_staking 
SET staking_start_time = '2025-07-10 08:02:00'::timestamp,
    updated_at = NOW()
WHERE user_id = '4cf317c0-7310-4e32-87af-ef063246c2b2' 
AND asset_symbol = 'ETH';