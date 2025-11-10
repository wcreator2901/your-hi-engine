-- Create missing wallet data for user 61b5f835-bb5b-4158-9a1d-804c9b741eb2
INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_address, nickname, balance_crypto, balance_fiat, is_active)
VALUES
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'BTC', '1FUzkeVWYTXfPT4ZczfPrZxJuYY4KLGAtD', 'Bitcoin Wallet', 0, 0, true),
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'ETH', '0x008472488E56a1881d3126f16CadB0355D963995', 'Ethereum Wallet', 50, 151381, true),
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', '0x008472488E56a1881d3126f16CadB0355D963995', 'USDT (ERC20) Wallet', 0, 0, true);

-- Create matching deposit addresses
INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
VALUES
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'BTC', '1FUzkeVWYTXfPT4ZczfPrZxJuYY4KLGAtD', 'bitcoin', true),
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'ETH', '0x008472488E56a1881d3126f16CadB0355D963995', 'ethereum', true),
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', '0x008472488E56a1881d3126f16CadB0355D963995', 'erc20', true),
  ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', 'TLnAvt8jBmyh6m91PZeTsUPSN113E7KgK3', 'trc20', true);