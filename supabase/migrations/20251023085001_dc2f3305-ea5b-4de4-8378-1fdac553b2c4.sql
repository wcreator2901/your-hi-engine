-- Create initial staking record for the user
INSERT INTO public.user_staking (
  user_id,
  asset_symbol,
  is_staking,
  daily_yield_percent,
  staking_start_time,
  last_calculation_time,
  total_profits_earned,
  accrued_profits
)
VALUES (
  '815503a2-d88d-4246-a279-d606c21f36fb',
  'ETH',
  true,
  0.0065, -- 0.65% daily
  NOW(),
  NOW(),
  0,
  0
)
ON CONFLICT DO NOTHING;