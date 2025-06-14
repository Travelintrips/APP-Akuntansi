-- Add manual_entry flag to general_ledger table
ALTER TABLE general_ledger ADD COLUMN IF NOT EXISTS manual_entry BOOLEAN DEFAULT FALSE;
