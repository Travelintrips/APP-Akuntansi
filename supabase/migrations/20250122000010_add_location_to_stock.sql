-- Add location column to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS location text DEFAULT '';
