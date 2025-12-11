DELETE FROM user_transactions 
WHERE user_id = '48cd698d-c0e2-4aa3-b822-243af7e59d48' 
  AND transaction_type = 'bank_transfer' 
  AND created_at::date = CURRENT_DATE