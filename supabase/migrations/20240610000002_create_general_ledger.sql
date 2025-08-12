-- Create general_ledger table
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  journal_entry_item_id UUID REFERENCES journal_entry_items(id) ON DELETE CASCADE,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for better performance
  CONSTRAINT fk_general_ledger_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_general_ledger_journal_entry_item 
    FOREIGN KEY (journal_entry_item_id) REFERENCES journal_entry_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_general_ledger_account 
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT
);

-- Enable RLS but allow all operations for now
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on general_ledger" ON general_ledger;
CREATE POLICY "Allow all operations on general_ledger"
  ON general_ledger
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_general_ledger_journal_entry_id ON general_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_general_ledger_account_id ON general_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_general_ledger_date ON general_ledger(date);
CREATE INDEX IF NOT EXISTS idx_general_ledger_journal_entry_item_id ON general_ledger(journal_entry_item_id);

-- Enable realtime
alter publication supabase_realtime add table general_ledger;