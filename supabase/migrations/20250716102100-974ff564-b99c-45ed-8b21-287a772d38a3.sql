-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    phone_number text NOT NULL,
    address text NOT NULL,
    front_document_url text,
    back_document_url text,
    front_document_name text,
    back_document_name text,
    status text NOT NULL DEFAULT 'pending',
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own KYC submissions
CREATE POLICY "Users can insert their own KYC submissions"
ON public.kyc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own KYC submissions
CREATE POLICY "Users can view their own KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own KYC submissions (only if status is 'rejected')
CREATE POLICY "Users can update rejected KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'rejected');

-- Admins can view all KYC submissions
CREATE POLICY "Admins can view all KYC submissions"
ON public.kyc_submissions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Admins can update all KYC submissions
CREATE POLICY "Admins can update all KYC submissions"
ON public.kyc_submissions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();