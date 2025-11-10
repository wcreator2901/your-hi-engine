-- Update the transaction to reference the existing user
UPDATE public.user_transactions 
SET user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d'
WHERE user_id = '6ab9c964-6cca-447b-883f-f66ff7a9f1d4';