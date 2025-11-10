
-- Update the user's ETH balance and backdate staking to wallet creation
-- Set balance to 1 ETH (matching the ~$3,895 USD shown in screenshot)
UPDATE user_wallets
SET 
  balance_crypto = 1.0,
  updated_at = NOW()
WHERE user_id = '815503a2-d88d-4246-a279-d606c21f36fb'
  AND asset_symbol = 'ETH';

-- Backdate staking start time to wallet creation date
-- Calculate profits: 1 ETH * 0.0065 daily rate * ~1.06 days = 0.00689 ETH
UPDATE user_staking
SET
  staking_start_time = '2025-10-22 07:16:48.843635+00'::timestamptz,
  last_calculation_time = '2025-10-22 07:16:48.843635+00'::timestamptz,
  total_profits_earned = 0.00689,
  accrued_profits = 0.00689,
  updated_at = NOW()
WHERE user_id = '815503a2-d88d-4246-a279-d606c21f36fb'
  AND asset_symbol = 'ETH';
