-- Add part_number column to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS part_number text DEFAULT '';
