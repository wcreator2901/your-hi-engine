-- Test transaction creation for user dd192e85-24bb-42d7-8e5d-385c4cfd06b4
INSERT INTO user_transactions (
  user_id,
  asset_symbol,
  transaction_type,
  amount,
  status,
  created_at
) VALUES (
  'dd192e85-24bb-42d7-8e5d-385c4cfd06b4',
  'ETH',
  'deposit',
  1.0,
  'pending',
  NOW()
);