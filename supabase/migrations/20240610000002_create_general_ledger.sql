-- Create general_ledger table
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  journal_entry_item_id UUID REFERENCES journal_entry_items(id) ON DELETE CASCADE,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow all operations for now
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on general_ledger" ON general_ledger;
CREATE POLICY "Allow all operations on general_ledger"
  ON general_ledger
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table general_ledger;