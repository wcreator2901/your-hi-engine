-- Make user e4e0333d-9fac-4ea9-9f30-a7e5e81f1780 an admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('e4e0333d-9fac-4ea9-9f30-a7e5e81f1780', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;