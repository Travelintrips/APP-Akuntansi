-- Fix the journal_entries table structure
ALTER TABLE IF EXISTS public.journal_entry_items
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.chart_of_accounts(id);

-- Update the account_id column if it already exists but needs to be linked
ALTER TABLE IF EXISTS public.journal_entry_items
DROP CONSTRAINT IF EXISTS journal_entry_items_account_id_fkey;

ALTER TABLE IF EXISTS public.journal_entry_items
ADD CONSTRAINT journal_entry_items_account_id_fkey
FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id);
