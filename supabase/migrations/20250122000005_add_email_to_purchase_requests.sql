-- Add email and attachment_url columns to purchase_requests table
ALTER TABLE public.purchase_requests 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.purchase_requests 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;
