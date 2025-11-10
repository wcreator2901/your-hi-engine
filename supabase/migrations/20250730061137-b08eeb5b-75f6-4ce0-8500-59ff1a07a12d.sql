-- Delete old non-HD wallets (keep only the new HD wallets that match Atomic Wallet)
DELETE FROM user_wallets 
WHERE is_hd_wallet = false OR derivation_path IS NULL;