INSERT INTO public.user_roles (user_id, role)
VALUES ('b71cba5d-9ade-401d-a416-b977b5b0e2fd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;