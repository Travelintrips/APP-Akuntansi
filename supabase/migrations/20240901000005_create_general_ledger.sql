-- Create general_ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  date DATE NOT NULL,
  description TEXT,
  debit DECIMAL(18, 2) DEFAULT 0,
  credit DECIMAL(18, 2) DEFAULT 0,
  running_balance DECIMAL(18, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  manual_entry BOOLEAN DEFAULT FALSE
);

-- Enable realtime for general_ledger table
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_ledger;

-- Create function to process journal entries
CREATE OR REPLACE FUNCTION process_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  running_balance DECIMAL(18, 2);
  normal_balance VARCHAR(10);
BEGIN
  -- For each account in the journal entry items
  FOR account_record IN 
    SELECT ji.account_id, ji.debit, ji.credit, coa.normal_balance
    FROM journal_entry_items ji
    JOIN chart_of_accounts coa ON ji.account_id = coa.id
    WHERE ji.journal_entry_id = NEW.id
  LOOP
    -- Get the current running balance for this account
    SELECT COALESCE(MAX(gl.running_balance), 0) INTO running_balance
    FROM general_ledger gl
    WHERE gl.account_id = account_record.account_id;
    
    -- Calculate new running balance based on normal balance
    IF account_record.normal_balance = 'DEBIT' THEN
      running_balance := running_balance + account_record.debit - account_record.credit;
    ELSE
      running_balance := running_balance - account_record.debit + account_record.credit;
    END IF;
    
    -- Insert into general ledger
    INSERT INTO general_ledger (
      account_id, journal_entry_id, date, description,
      debit, credit, running_balance
    ) VALUES (
      account_record.account_id, NEW.id, NEW.date, NEW.description,
      account_record.debit, account_record.credit, running_balance
    );
    
    -- Update account balance
    UPDATE chart_of_accounts
    SET 
      current_balance = running_balance,
      debit_total = debit_total + account_record.debit,
      credit_total = credit_total + account_record.credit,
      updated_at = NOW()
    WHERE id = account_record.account_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for journal entries
DROP TRIGGER IF EXISTS after_journal_entry_insert ON journal_entries;
CREATE TRIGGER after_journal_entry_insert
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION process_journal_entry();

-- Create function to update all account totals
CREATE OR REPLACE FUNCTION update_all_account_totals()
RETURNS VOID AS $$
DECLARE
  account_record RECORD;
BEGIN
  -- Reset all account balances
  UPDATE chart_of_accounts
  SET current_balance = 0, debit_total = 0, credit_total = 0;
  
  -- Delete all general ledger entries
  DELETE FROM general_ledger WHERE manual_entry = FALSE;
  
  -- Process all journal entries in date order
  FOR account_record IN 
    SELECT je.id
    FROM journal_entries je
    ORDER BY je.date, je.created_at
  LOOP
    -- Trigger the process_journal_entry function for each entry
    PERFORM process_journal_entry()
    FROM journal_entries
    WHERE id = account_record.id;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
