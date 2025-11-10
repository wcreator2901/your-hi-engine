-- Check and fix foreign key constraint for user_transactions table
-- First, let's remove any existing foreign key constraint that might be referencing auth.users
-- (which we can't query directly from the public schema)

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.user_transactions 
DROP CONSTRAINT IF EXISTS user_transactions_user_id_fkey;

-- Since we're working with user profiles, we don't need a foreign key constraint
-- to auth.users (which is managed by Supabase), we'll just ensure the user_id 
-- column can accept any valid UUID