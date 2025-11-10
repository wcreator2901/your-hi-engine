-- Insert default crypto addresses for BTC and USDT_TRON
INSERT INTO default_crypto_addresses (btc_address, usdt_trc20_address, created_at, updated_at)
VALUES ('3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5', 'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS', now(), now())
ON CONFLICT DO NOTHING;