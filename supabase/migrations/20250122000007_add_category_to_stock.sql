-- Add category column to stock table
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS category text[] DEFAULT '{}';
