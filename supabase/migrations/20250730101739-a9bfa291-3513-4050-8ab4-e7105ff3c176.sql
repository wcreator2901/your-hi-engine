-- Add user as admin
INSERT INTO public.admin_users (user_id, role) 
VALUES ('5ddcb9c5-f998-4380-ba4a-9457f85ad68b', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';