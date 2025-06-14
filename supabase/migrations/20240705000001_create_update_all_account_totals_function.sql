-- Create function to update all account totals based on date range
CREATE OR REPLACE FUNCTION update_all_account_totals(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_account_id UUID;
  v_account_type TEXT;
  v_debit_sum DECIMAL(15,2);
  v_credit_sum DECIMAL(15,2);
  v_balance DECIMAL(15,2);
BEGIN
  -- Reset all account totals to zero before recalculating
  UPDATE chart_of_accounts SET total_debits = 0, total_credits = 0, current_balance = 0;
  
  -- Loop through all accounts
  FOR v_account_id, v_account_type IN 
    SELECT id, account_type FROM chart_of_accounts
  LOOP
    -- Calculate total debits and credits for the account within date range
    SELECT 
      COALESCE(SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END), 0)
    INTO v_debit_sum, v_credit_sum
    FROM general_ledger
    WHERE account_id = v_account_id
    AND (p_start_date IS NULL OR transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR transaction_date <= p_end_date);
    
    -- Calculate balance based on account type
    IF v_account_type IN ('ASSET', 'EXPENSE') THEN
      v_balance := v_debit_sum - v_credit_sum;
    ELSE
      v_balance := v_credit_sum - v_debit_sum;
    END IF;
    
    -- Update the account with calculated values
    UPDATE chart_of_accounts
    SET 
      total_debits = v_debit_sum,
      total_credits = v_credit_sum,
      current_balance = v_balance
    WHERE id = v_account_id;
  END LOOP;
  
  -- Update parent accounts by summing their children
  WITH RECURSIVE account_hierarchy AS (
    SELECT 
      id, 
      parent_id, 
      current_balance,
      total_debits,
      total_credits,
      0 AS level
    FROM chart_of_accounts
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT 
      c.id, 
      c.parent_id, 
      c.current_balance,
      c.total_debits,
      c.total_credits,
      h.level + 1
    FROM chart_of_accounts c
    JOIN account_hierarchy h ON c.parent_id = h.id
  ),
  summed_children AS (
    SELECT 
      parent_id,
      SUM(current_balance) AS sum_balance,
      SUM(total_debits) AS sum_debits,
      SUM(total_credits) AS sum_credits
    FROM chart_of_accounts
    WHERE parent_id IS NOT NULL
    GROUP BY parent_id
  )
  UPDATE chart_of_accounts c
  SET 
    current_balance = c.current_balance + COALESCE(s.sum_balance, 0),
    total_debits = c.total_debits + COALESCE(s.sum_debits, 0),
    total_credits = c.total_credits + COALESCE(s.sum_credits, 0)
  FROM summed_children s
  WHERE c.id = s.parent_id;
  
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for chart_of_accounts if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chart_of_accounts'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE chart_of_accounts;
  END IF;
END
$$;
