-- Add missing column used by client tracking to prevent 400 errors on inserts
ALTER TABLE public.visitor_activity
ADD COLUMN IF NOT EXISTS screen_resolution text;