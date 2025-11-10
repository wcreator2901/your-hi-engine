-- Add user as admin
INSERT INTO public.admin_users (user_id, role)
VALUES ('825d5512-9580-4f2e-8587-166d741429de', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = now();