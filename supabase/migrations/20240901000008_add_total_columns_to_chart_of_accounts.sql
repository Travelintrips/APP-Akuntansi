-- Add total_debit and total_credit columns to chart_of_accounts if they don't exist
ALTER TABLE IF EXISTS public.chart_of_accounts
ADD COLUMN IF NOT EXISTS total_debit NUMERIC DEFAULT 0;

ALTER TABLE IF EXISTS public.chart_of_accounts
ADD COLUMN IF NOT EXISTS total_credit NUMERIC DEFAULT 0;
