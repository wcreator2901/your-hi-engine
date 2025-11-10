
-- First, insert missing user profiles for any users referenced in chat_rooms
INSERT INTO public.user_profiles (id, username, full_name, status)
SELECT DISTINCT user_id, 'user_' || SUBSTRING(user_id::text, 1, 8), 'User', 'active'
FROM public.chat_rooms 
WHERE user_id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Also insert missing profiles for admin_id if they exist
INSERT INTO public.user_profiles (id, username, full_name, status)
SELECT DISTINCT admin_id, 'admin_' || SUBSTRING(admin_id::text, 1, 8), 'Admin', 'active'
FROM public.chat_rooms 
WHERE admin_id IS NOT NULL 
AND admin_id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Insert missing profiles for any users referenced in chat_messages
INSERT INTO public.user_profiles (id, username, full_name, status)
SELECT DISTINCT sender_id, 'user_' || SUBSTRING(sender_id::text, 1, 8), 'User', 'active'
FROM public.chat_messages 
WHERE sender_id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraints only if they don't exist
DO $$ 
BEGIN
    -- Add chat_rooms foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_rooms_user_id_fkey'
    ) THEN
        ALTER TABLE public.chat_rooms 
        ADD CONSTRAINT chat_rooms_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_rooms_admin_id_fkey'
    ) THEN
        ALTER TABLE public.chat_rooms 
        ADD CONSTRAINT chat_rooms_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add chat_messages foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_sender_id_fkey'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable real-time for chat tables
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create storage bucket for chat files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can update chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;

-- Enable RLS on chat tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms" ON public.chat_rooms
FOR SELECT USING (
  user_id = auth.uid() OR 
  admin_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create their own chat rooms" ON public.chat_rooms
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update chat rooms" ON public.chat_rooms
FOR UPDATE USING (
  admin_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
FOR SELECT USING (
  room_id IN (
    SELECT id FROM public.chat_rooms 
    WHERE user_id = auth.uid() OR admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Users can send messages in their rooms" ON public.chat_messages
FOR INSERT WITH CHECK (
  room_id IN (
    SELECT id FROM public.chat_rooms 
    WHERE user_id = auth.uid() OR admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Users can update their own messages" ON public.chat_messages
FOR UPDATE USING (sender_id = auth.uid());
