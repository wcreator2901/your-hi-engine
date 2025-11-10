-- Delete the incorrect transaction with wrong user_id
DELETE FROM user_transactions WHERE id = '1cfd28f7-028a-4846-9761-900f9177a367';

-- Create the correct transaction with the proper user_id
INSERT INTO user_transactions (
  user_id,
  asset_symbol,
  transaction_type,
  amount,
  status,
  transaction_hash,
  created_at
) VALUES (
  'dd192e85-24bb-42d7-8e5d-385c4cfd06b4', -- Correct user_id
  'ETH',
  'deposit',
  11.0,
  'completed',
  'xxx',
  '2025-07-31 10:24:00+00'
);