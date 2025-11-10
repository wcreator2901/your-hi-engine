-- Update the check constraint to allow 'bank_transfer' as a valid transaction type
ALTER TABLE user_transactions 
DROP CONSTRAINT user_transactions_transaction_type_check;

ALTER TABLE user_transactions 
ADD CONSTRAINT user_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'stake'::text, 'unstake'::text, 'transfer'::text, 'bank_transfer'::text]));