-- Add rentable units fields to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS model text DEFAULT '',
ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS plate_number text DEFAULT '';
