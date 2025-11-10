-- Initialize staking data for the current user (test user)
INSERT INTO public.user_staking (
  user_id,
  asset_symbol,
  is_staking,
  staking_start_time,
  last_calculation_time,
  accrued_profits,
  total_profits_earned,
  daily_yield_percent
) VALUES (
  '5ddcb9c5-f998-4380-ba4a-9457f85ad68b',
  'ETH',
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  0.071500,
  0.071500,
  0.65
) ON CONFLICT (user_id, asset_symbol) DO UPDATE SET
  is_staking = EXCLUDED.is_staking,
  staking_start_time = EXCLUDED.staking_start_time,
  last_calculation_time = EXCLUDED.last_calculation_time,
  accrued_profits = EXCLUDED.accrued_profits,
  total_profits_earned = EXCLUDED.total_profits_earned,
  daily_yield_percent = EXCLUDED.daily_yield_percent;