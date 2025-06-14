-- Drop the existing function first
DROP FUNCTION IF EXISTS process_journal_entry(uuid);

-- Recreate the function with the renamed parameter
CREATE OR REPLACE FUNCTION process_journal_entry(p_journal_entry_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert into general_ledger for each journal entry item
  INSERT INTO general_ledger (journal_entry_id, account_id, date, description, debit, credit)
  SELECT 
    jei.journal_entry_id,
    jei.account_id,
    je.date,
    je.description,
    jei.debit,
    jei.credit
  FROM 
    journal_entry_items jei
  JOIN 
    journal_entries je ON je.id = jei.journal_entry_id
  WHERE 
    jei.journal_entry_id = p_journal_entry_id;

  -- Update account balances
  UPDATE chart_of_accounts coa
  SET 
    current_balance = current_balance + (
      SELECT COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)
      FROM journal_entry_items jei
      WHERE jei.journal_entry_id = p_journal_entry_id AND jei.account_id = coa.id
    )
  WHERE id IN (
    SELECT DISTINCT account_id 
    FROM journal_entry_items 
    WHERE journal_entry_id = p_journal_entry_id
  );
END;
$$ LANGUAGE plpgsql;
