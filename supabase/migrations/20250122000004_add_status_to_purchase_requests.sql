-- Add status column to purchase_requests table
ALTER TABLE public.purchase_requests 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';

-- Add check constraint for valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_requests_status_check'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD CONSTRAINT purchase_requests_status_check 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'));
    END IF;
END $$;