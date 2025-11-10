-- Add recovery phrases table for 2FA reset functionality
CREATE TABLE public.user_recovery_phrases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recovery_phrase_encrypted text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_recovery_phrases ENABLE ROW LEVEL SECURITY;

-- Create policies for recovery phrases
CREATE POLICY "Users can view their own recovery phrases" 
ON public.user_recovery_phrases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery phrases" 
ON public.user_recovery_phrases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery phrases" 
ON public.user_recovery_phrases 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_user_recovery_phrases_user_id ON public.user_recovery_phrases(user_id);
CREATE INDEX idx_user_recovery_phrases_active ON public.user_recovery_phrases(user_id, is_active) WHERE is_active = true;