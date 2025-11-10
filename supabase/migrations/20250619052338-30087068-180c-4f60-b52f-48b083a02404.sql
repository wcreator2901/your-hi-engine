
-- Create table for storing user seed phrases
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

-- Create index for faster lookups
CREATE INDEX idx_user_seed_phrases_user_id ON public.user_seed_phrases(user_id);
