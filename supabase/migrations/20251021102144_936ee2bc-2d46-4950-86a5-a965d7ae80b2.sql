-- Create user_2fa table
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_id UUID,
  creator_id UUID,
  status TEXT DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  message_text TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_notifications table
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID,
  message_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add amount_fiat to bank_accounts if not exists
ALTER TABLE public.bank_accounts 
  ADD COLUMN IF NOT EXISTS amount_fiat NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can view own 2FA settings"
  ON public.user_2fa FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can insert own 2FA settings"
  ON public.user_2fa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can update own 2FA settings"
  ON public.user_2fa FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_rooms
DROP POLICY IF EXISTS "Users can view own chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view own chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "Users can insert chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can insert chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can update own chat rooms"
  ON public.chat_rooms FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = admin_id);

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON public.chat_messages;
CREATE POLICY "Users can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  USING (true);

-- RLS Policies for chat_notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.chat_notifications;
CREATE POLICY "Users can view own notifications"
  ON public.chat_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.chat_notifications;
CREATE POLICY "Users can insert notifications"
  ON public.chat_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.chat_notifications;
CREATE POLICY "Users can update own notifications"
  ON public.chat_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
DROP TRIGGER IF EXISTS trg_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER trg_user_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER trg_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_chat_notifications_updated_at ON public.chat_notifications;
CREATE TRIGGER trg_chat_notifications_updated_at
  BEFORE UPDATE ON public.chat_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function to check if user is admin
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user has admin role in raw_app_meta_data
  SELECT 
    COALESCE(
      (raw_app_meta_data->>'is_admin')::BOOLEAN,
      false
    ) INTO is_admin
  FROM auth.users
  WHERE id = check_user_id;
  
  RETURN COALESCE(is_admin, false);
END;
$$;