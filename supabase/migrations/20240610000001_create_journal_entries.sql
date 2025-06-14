-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entry_items table for the debit and credit entries
CREATE TABLE IF NOT EXISTS journal_entry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_debit_credit CHECK (debit = 0 OR credit = 0) -- Ensure only one of debit or credit has a value
);

-- Enable RLS but allow all operations for now
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_items ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all operations on journal_entries" ON journal_entries;
CREATE POLICY "Allow all operations on journal_entries"
  ON journal_entries
  USING (true);

DROP POLICY IF EXISTS "Allow all operations on journal_entry_items" ON journal_entry_items;
CREATE POLICY "Allow all operations on journal_entry_items"
  ON journal_entry_items
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table journal_entries;
alter publication supabase_realtime add table journal_entry_items;