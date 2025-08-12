-- Add journal_entry_item_id column to general_ledger if it doesn't exist
ALTER TABLE general_ledger 
ADD COLUMN IF NOT EXISTS journal_entry_item_id UUID;

-- Create foreign key constraint for journal_entry_item_id
ALTER TABLE general_ledger 
DROP CONSTRAINT IF EXISTS fk_general_ledger_journal_entry_item;

ALTER TABLE general_ledger 
ADD CONSTRAINT fk_general_ledger_journal_entry_item 
FOREIGN KEY (journal_entry_item_id) 
REFERENCES journal_entry_items(id) 
ON DELETE CASCADE;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_journal_entry_id 
ON journal_entry_items(journal_entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_items_account_id 
ON journal_entry_items(account_id);

CREATE INDEX IF NOT EXISTS idx_general_ledger_journal_entry_item_id 
ON general_ledger(journal_entry_item_id);

-- Drop the view if it exists, then create it
DROP VIEW IF EXISTS journal_entry_items_with_ledger;

-- Create a view that joins journal_entry_items with general_ledger only
CREATE VIEW journal_entry_items_with_ledger AS
SELECT 
  ji.id as journal_entry_item_id,
  ji.journal_entry_id,
  ji.account_id,
  ji.debit as item_debit,
  ji.credit as item_credit,
  ji.created_at as item_created_at,
  ji.updated_at as item_updated_at,
  
  -- General Ledger data
  gl.id as general_ledger_id,
  gl.date as ledger_date,
  gl.description as ledger_description,
  gl.debit as ledger_debit,
  gl.credit as ledger_credit,
  gl.running_balance,
  gl.created_at as ledger_created_at,
  gl.updated_at as ledger_updated_at,
  gl.manual_entry
  
FROM journal_entry_items ji
LEFT JOIN general_ledger gl ON ji.id = gl.journal_entry_item_id
ORDER BY ji.journal_entry_id, ji.created_at;