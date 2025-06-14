-- Fix the process_journal_entry function to ensure description is never null
CREATE OR REPLACE FUNCTION process_journal_entry(p_journal_entry_id UUID)
RETURNS VOID AS $$
DECLARE
  je_record RECORD;
  je_item RECORD;
  account_type TEXT;
  current_balance DECIMAL(15, 2);
  new_balance DECIMAL(15, 2);
  entry_description TEXT;
BEGIN
  -- Get the journal entry
  SELECT * INTO je_record FROM journal_entries WHERE id = p_journal_entry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry with ID % not found', p_journal_entry_id;
  END IF;
  
  -- Ensure description is not null
  entry_description := COALESCE(je_record.description, 'Journal Entry ' || p_journal_entry_id);
  
  -- Process each journal entry item
  FOR je_item IN 
    SELECT * FROM journal_entry_items WHERE journal_entry_id = je_record.id
  LOOP
    -- Get the account type
    SELECT account_type INTO account_type FROM chart_of_accounts WHERE id = je_item.account_id;
    
    -- Get the current balance for this account
    SELECT COALESCE(MAX(balance), 0) INTO current_balance 
    FROM general_ledger 
    WHERE account_id = je_item.account_id;
    
    -- Calculate the new balance based on account type and debit/credit
    IF account_type IN ('Aset', 'Beban') THEN
      -- For asset and expense accounts, debits increase the balance and credits decrease it
      new_balance := current_balance + je_item.debit - je_item.credit;
    ELSE
      -- For liability, equity, and revenue accounts, credits increase the balance and debits decrease it
      new_balance := current_balance - je_item.debit + je_item.credit;
    END IF;
    
    -- Insert into general_ledger with non-null description
    INSERT INTO general_ledger (
      account_id, 
      date, 
      description, 
      journal_entry_id, 
      journal_entry_item_id, 
      debit, 
      credit, 
      balance
    ) VALUES (
      je_item.account_id,
      je_record.date,
      entry_description,
      je_record.id,
      je_item.id,
      je_item.debit,
      je_item.credit,
      new_balance
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;