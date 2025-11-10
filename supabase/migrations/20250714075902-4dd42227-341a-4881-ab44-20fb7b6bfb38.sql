-- Update the staking start time to reflect 4 days of staking
UPDATE user_staking 
SET staking_start_time = '2025-07-10 07:58:48'::timestamp,
    updated_at = NOW()
WHERE user_id = '4cf317c0-7310-4e32-87af-ef063246c2b2' 
AND asset_symbol = 'ETH';