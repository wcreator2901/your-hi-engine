
-- Add the current user as an admin
INSERT INTO public.admin_users (user_id, role)
VALUES ('61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
