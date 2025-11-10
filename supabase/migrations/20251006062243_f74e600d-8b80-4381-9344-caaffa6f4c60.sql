-- Create security definer function to check admin status
-- This prevents infinite recursion by executing with elevated privileges
CREATE OR REPLACE FUNCTION public.check_user_is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Only admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can insert bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can update chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.smart_contracts;
DROP POLICY IF EXISTS "Admins can manage contract wallets" ON public.contract_wallets;
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.user_transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.user_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.user_transactions;

-- Recreate policies using the security definer function
-- Admin Users Table
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
USING (public.check_user_is_admin());

CREATE POLICY "Admins can insert admin_users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.check_user_is_admin());

-- Bank Accounts Table
CREATE POLICY "Admins can view bank accounts"
ON public.bank_accounts
FOR SELECT
USING (public.check_user_is_admin());

CREATE POLICY "Admins can insert bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Admins can update bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (public.check_user_is_admin());

CREATE POLICY "Admins can delete bank accounts"
ON public.bank_accounts
FOR DELETE
USING (public.check_user_is_admin());

-- Chat Messages Table
CREATE POLICY "Admins can delete messages"
ON public.chat_messages
FOR DELETE
USING (public.check_user_is_admin());

CREATE POLICY "Admins can update messages"
ON public.chat_messages
FOR UPDATE
USING (public.check_user_is_admin());

CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() 
  AND room_id IN (
    SELECT id FROM chat_rooms 
    WHERE user_id = auth.uid() OR public.check_user_is_admin()
  )
);

CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (
  room_id IN (
    SELECT id FROM chat_rooms 
    WHERE user_id = auth.uid() OR public.check_user_is_admin()
  )
);

-- Chat Rooms Table
CREATE POLICY "Admins can delete chat rooms"
ON public.chat_rooms
FOR DELETE
USING (public.check_user_is_admin());

CREATE POLICY "Admins can update chat rooms"
ON public.chat_rooms
FOR UPDATE
USING (public.check_user_is_admin());

CREATE POLICY "Users can view own chat rooms"
ON public.chat_rooms
FOR SELECT
USING (auth.uid() = user_id OR public.check_user_is_admin());

-- Smart Contracts Table
CREATE POLICY "Admins can manage contracts"
ON public.smart_contracts
FOR ALL
USING (public.check_user_is_admin());

-- Contract Wallets Table
CREATE POLICY "Admins can manage contract wallets"
ON public.contract_wallets
FOR ALL
USING (public.check_user_is_admin());

-- User Transactions Table
CREATE POLICY "Admins can insert transactions"
ON public.user_transactions
FOR INSERT
WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Admins can update transactions"
ON public.user_transactions
FOR UPDATE
USING (public.check_user_is_admin());

CREATE POLICY "Admins can view all transactions"
ON public.user_transactions
FOR SELECT
USING (public.check_user_is_admin());

CREATE POLICY "Admins can delete transactions"
ON public.user_transactions
FOR DELETE
USING (public.check_user_is_admin());