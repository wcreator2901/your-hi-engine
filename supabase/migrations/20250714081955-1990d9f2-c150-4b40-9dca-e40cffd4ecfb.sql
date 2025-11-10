-- Force enable staking for user d3b03325-6f4b-4803-a872-6de4e6af1952 with correct 4-day start time
UPDATE user_staking 
SET staking_start_time = '2025-07-10 08:02:00'::timestamp,
    is_staking = true,
    last_calculation_time = NOW(),
    updated_at = NOW()
WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' 
AND asset_symbol = 'ETH';

-- Verify the update
SELECT * FROM user_staking WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' AND asset_symbol = 'ETH';