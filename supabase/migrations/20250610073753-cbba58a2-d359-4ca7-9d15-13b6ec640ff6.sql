
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can view all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can update all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can delete all chat rooms" ON public.chat_rooms;

-- Enable RLS on chat_rooms table if not already enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view all chat rooms
CREATE POLICY "Admins can view all chat rooms" 
  ON public.chat_rooms 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy to allow users to view their own chat rooms
CREATE POLICY "Users can view their own chat rooms" 
  ON public.chat_rooms 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy to allow admins to create chat rooms for any user
CREATE POLICY "Admins can create chat rooms" 
  ON public.chat_rooms 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy to allow users to create their own chat rooms
CREATE POLICY "Users can create their own chat rooms" 
  ON public.chat_rooms 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create policy to allow admins to update all chat rooms
CREATE POLICY "Admins can update all chat rooms" 
  ON public.chat_rooms 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy to allow users to update their own chat rooms
CREATE POLICY "Users can update their own chat rooms" 
  ON public.chat_rooms 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create policy to allow admins to delete all chat rooms
CREATE POLICY "Admins can delete all chat rooms" 
  ON public.chat_rooms 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
