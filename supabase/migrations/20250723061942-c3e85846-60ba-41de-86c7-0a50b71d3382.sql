-- Create table for storing user seed phrases (recovery phrases)
CREATE TABLE public.user_seed_phrases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_phrase_encrypted TEXT NOT NULL,
  is_generated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_seed_phrases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own seed phrases
CREATE POLICY "Users can view their own seed phrases" 
  ON public.user_seed_phrases 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seed phrases" 
  ON public.user_seed_phrases 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all seed phrases for recovery purposes
CREATE POLICY "Admins can view all user seed phrases" 
  ON public.user_seed_phrases 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_user_seed_phrases_user_id ON public.user_seed_phrases(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_seed_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_seed_phrases_updated_at
  BEFORE UPDATE ON public.user_seed_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seed_phrases_updated_at();