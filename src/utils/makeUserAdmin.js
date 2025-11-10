
// This is a utility script to make a user an admin
// You can run this in the Supabase SQL Editor replacing YOUR_USER_ID with your actual user ID

/*
-- To make a user an admin, run this SQL in the Supabase SQL Editor:

INSERT INTO public.admin_users (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = now();

-- To check if a user is an admin:
SELECT * FROM public.admin_users WHERE user_id = 'YOUR_USER_ID';

-- To remove admin privileges:
DELETE FROM public.admin_users WHERE user_id = 'YOUR_USER_ID';
*/
