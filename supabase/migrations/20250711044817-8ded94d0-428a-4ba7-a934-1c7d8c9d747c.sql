-- Update user email in auth.users table
UPDATE auth.users 
SET email = 'darylbrooks@bigpond.com', 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email": "darylbrooks@bigpond.com"}'::jsonb,
    updated_at = now()
WHERE id = 'f075103f-83ee-4e16-81e3-a1c7541f4b51';