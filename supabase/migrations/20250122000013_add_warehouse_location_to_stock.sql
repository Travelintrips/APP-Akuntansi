-- Add warehouse_location column to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS warehouse_location text NOT NULL DEFAULT '';
