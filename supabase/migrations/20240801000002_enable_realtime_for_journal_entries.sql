-- Enable realtime for journal_entries table
alter publication supabase_realtime add table journal_entries;

-- Enable realtime for journal_entry_items table
alter publication supabase_realtime add table journal_entry_items;

-- Enable realtime for general_ledger table
alter publication supabase_realtime add table general_ledger;
