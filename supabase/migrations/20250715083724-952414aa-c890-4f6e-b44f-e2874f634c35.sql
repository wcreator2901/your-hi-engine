-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add missing admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update user_wallets table structure to match interface
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS balance_crypto DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_fiat DECIMAL(12, 2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users (only admins can access)
CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only super admins can modify admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view public chat rooms" ON public.chat_rooms
  FOR SELECT USING (NOT is_private OR creator_id = auth.uid());

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Only creators can update their chat rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = creator_id);

-- Add triggers for new tables
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();