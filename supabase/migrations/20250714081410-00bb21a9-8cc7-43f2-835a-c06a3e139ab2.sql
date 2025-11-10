-- Force update the staking start time to exactly 4 days ago for user d3b03325-6f4b-4803-a872-6de4e6af1952
UPDATE user_staking 
SET staking_start_time = '2025-07-10 08:02:00'::timestamp,
    updated_at = NOW()
WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' 
AND asset_symbol = 'ETH';