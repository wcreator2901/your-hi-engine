-- DELETE all existing broken seed phrases and let users regenerate fresh ones
-- This ensures user and admin always see the SAME phrase
DELETE FROM user_seed_phrases;

-- Also clean up any wallets so users start fresh
DELETE FROM user_wallets WHERE is_hd_wallet = true;