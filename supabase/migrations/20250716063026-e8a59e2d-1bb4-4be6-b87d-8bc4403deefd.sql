-- Create a user profile for the orphaned transaction
INSERT INTO public.user_profiles (user_id, email, full_name, username)
VALUES (
  '6ab9c964-6cca-447b-883f-f66ff7a9f1d4',
  'user@example.com',
  'Test User',
  'testuser'
);