-- Fix the staking start time to use the original creation time
UPDATE user_staking 
SET staking_start_time = created_at,
    updated_at = NOW()
WHERE user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d' 
  AND asset_symbol = 'ETH';