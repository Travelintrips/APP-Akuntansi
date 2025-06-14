-- Add balance_total column to chart_of_accounts if it doesn't exist
ALTER TABLE IF EXISTS public.chart_of_accounts
ADD COLUMN IF NOT EXISTS balance_total NUMERIC DEFAULT 0;
