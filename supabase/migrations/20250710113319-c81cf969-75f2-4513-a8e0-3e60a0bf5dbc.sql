-- Delete all KYC submissions for user 246b0d62-3a19-4a81-9b41-f67ec6d72c0d
DELETE FROM public.kyc_submissions 
WHERE user_id = '246b0d62-3a19-4a81-9b41-f67ec6d72c0d';