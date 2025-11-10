
-- First, let's clean up duplicate chat rooms by keeping only the most recent one per user
WITH ranked_rooms AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.chat_rooms
)
DELETE FROM public.chat_rooms 
WHERE id IN (
  SELECT id FROM ranked_rooms WHERE rn > 1
);

-- Now add the unique constraint to ensure one chat room per user
ALTER TABLE public.chat_rooms 
ADD CONSTRAINT unique_user_chat_room 
UNIQUE (user_id);
