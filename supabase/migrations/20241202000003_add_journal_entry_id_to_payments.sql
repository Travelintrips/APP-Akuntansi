-- Add journal_entry_id column to payments table
ALTER TABLE payments ADD COLUMN journal_entry_id UUID REFERENCES journal_entries(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_journal_entry_id ON payments(journal_entry_id);
