-- First add the missing column to chart_of_accounts if it doesn't exist
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0;

-- Drop the existing function first
DROP FUNCTION IF EXISTS process_journal_entry(uuid);

-- Recreate the function with the correct column names
CREATE OR REPLACE FUNCTION process_journal_entry(p_journal_entry_id uuid)
RETURNS void AS $$
DECLARE
  v_account_id uuid;
  v_debit_sum decimal(15, 2);
  v_credit_sum decimal(15, 2);
  v_current_balance decimal(15, 2);
BEGIN
  -- Insert into general_ledger for each journal entry item
  INSERT INTO general_ledger (journal_entry_id, journal_entry_item_id, account_id, date, description, debit, credit, balance)
  SELECT 
    jei.journal_entry_id,
    jei.id,
    jei.account_id,
    je.date,
    je.description,
    jei.debit,
    jei.credit,
    0 -- Temporary balance value, will be updated later
  FROM 
    journal_entry_items jei
  JOIN 
    journal_entries je ON je.id = jei.journal_entry_id
  WHERE 
    jei.journal_entry_id = p_journal_entry_id;

  -- Update account balances
  FOR v_account_id IN 
    SELECT DISTINCT account_id 
    FROM journal_entry_items 
    WHERE journal_entry_id = p_journal_entry_id
  LOOP
    -- Calculate the net change for this account in this journal entry
    SELECT 
      COALESCE(SUM(debit), 0),
      COALESCE(SUM(credit), 0)
    INTO 
      v_debit_sum,
      v_credit_sum
    FROM 
      journal_entry_items 
    WHERE 
      journal_entry_id = p_journal_entry_id AND account_id = v_account_id;
    
    -- Update the account balance
    UPDATE chart_of_accounts 
    SET balance = balance + (v_debit_sum - v_credit_sum)
    WHERE id = v_account_id
    RETURNING balance INTO v_current_balance;
    
    -- Update the balance in the general ledger entries for this account
    UPDATE general_ledger
    SET balance = v_current_balance
    WHERE 
      journal_entry_id = p_journal_entry_id AND 
      account_id = v_account_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
