-- Create missing chat_messages table that the useChat hook expects
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT DEFAULT 'user' CHECK (sender_type IN ('user', 'admin')),
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for chat_messages
CREATE POLICY "Users can view messages in rooms they have access to" 
ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = room_id 
    AND (NOT cr.is_private OR cr.creator_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages in accessible rooms" 
ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = room_id 
    AND (NOT cr.is_private OR cr.creator_id = auth.uid())
  )
);

-- Add missing columns to chat_rooms table that ChatRoom interface expects
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resolved')),
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Add trigger for chat_messages
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();