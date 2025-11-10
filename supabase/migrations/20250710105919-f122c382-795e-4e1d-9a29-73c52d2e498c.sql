-- Add a column to track if user can resubmit after rejection
ALTER TABLE public.kyc_submissions 
ADD COLUMN can_resubmit BOOLEAN NOT NULL DEFAULT false;

-- Create an index for better performance when checking resubmission eligibility
CREATE INDEX idx_kyc_submissions_user_resubmit ON public.kyc_submissions(user_id, can_resubmit, status);