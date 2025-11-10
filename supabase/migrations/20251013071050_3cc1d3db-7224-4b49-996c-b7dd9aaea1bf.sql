-- Delete user 46f9b35f-99c8-401c-9ede-0630ae474ceb and all associated data

-- First, update default_crypto_addresses to remove the foreign key reference
UPDATE public.default_crypto_addresses 
SET updated_by = NULL 
WHERE updated_by = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from admin_users
DELETE FROM public.admin_users WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from chat_notifications (if any)
DELETE FROM public.chat_notifications WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from chat_messages via chat_rooms
DELETE FROM public.chat_messages WHERE room_id IN (
  SELECT id FROM public.chat_rooms WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb'
);

-- Delete from chat_rooms
DELETE FROM public.chat_rooms WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from user_wallets
DELETE FROM public.user_wallets WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from user_seed_phrases
DELETE FROM public.user_seed_phrases WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from user_private_keys
DELETE FROM public.user_private_keys WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from user_2fa
DELETE FROM public.user_2fa WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from deposit_addresses
DELETE FROM public.deposit_addresses WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from user_profiles
DELETE FROM public.user_profiles WHERE user_id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';

-- Delete from auth.users (this will cascade to remaining tables)
DELETE FROM auth.users WHERE id = '46f9b35f-99c8-401c-9ede-0630ae474ceb';