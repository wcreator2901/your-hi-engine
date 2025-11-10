-- Make user b05d2185-ae4d-48b2-8801-f14e13cc908d an admin
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
  'b05d2185-ae4d-48b2-8801-f14e13cc908d',
  'super_admin',
  ARRAY['all_permissions', 'user_management', 'transaction_management', 'system_settings']
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = now();