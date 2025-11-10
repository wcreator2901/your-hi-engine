-- Enable realtime for kyc_submissions table
ALTER TABLE public.kyc_submissions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_submissions;