-- Add unit column to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS unit text;
