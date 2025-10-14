-- Add tax column to purchase_requests table
ALTER TABLE public.purchase_requests 
ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) NOT NULL DEFAULT 0;
