-- Delete all data from all tables
-- Start with tables that have foreign key dependencies first

-- Delete bank accounts (references user_transactions)
DELETE FROM public.bank_accounts;

-- Delete chat messages (references chat_rooms)
DELETE FROM public.chat_messages;

-- Delete chat rooms
DELETE FROM public.chat_rooms;

-- Delete user messages
DELETE FROM public.user_messages;

-- Delete user profiles
DELETE FROM public.user_profiles;

-- Delete user seed phrases
DELETE FROM public.user_seed_phrases;

-- Delete user staking
DELETE FROM public.user_staking;

-- Delete user transactions
DELETE FROM public.user_transactions;

-- Delete user wallets
DELETE FROM public.user_wallets;

-- Delete admin users
DELETE FROM public.admin_users;