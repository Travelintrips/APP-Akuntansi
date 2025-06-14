-- Add total columns to chart_of_accounts table
ALTER TABLE chart_of_accounts
ADD COLUMN debit_total FLOAT DEFAULT 0,
ADD COLUMN credit_total FLOAT DEFAULT 0,
ADD COLUMN balance_total FLOAT DEFAULT 0;

-- Create function to calculate account totals based on date range
CREATE OR REPLACE FUNCTION calculate_account_totals(p_account_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (debit_sum FLOAT, credit_sum FLOAT, balance_sum FLOAT) AS $$
DECLARE
    v_account_type TEXT;
BEGIN
    -- Get the account type to determine balance calculation
    SELECT account_type INTO v_account_type FROM chart_of_accounts WHERE id = p_account_id;
    
    RETURN QUERY
    WITH ledger_totals AS (
        SELECT 
            SUM(debit) as total_debit,
            SUM(credit) as total_credit
        FROM general_ledger
        WHERE account_id = p_account_id
        AND (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date)
    )
    SELECT 
        COALESCE(total_debit, 0) as debit_sum,
        COALESCE(total_credit, 0) as credit_sum,
        CASE 
            WHEN v_account_type IN ('Aset', 'Beban') THEN COALESCE(total_debit, 0) - COALESCE(total_credit, 0)
            WHEN v_account_type IN ('Kewajiban', 'Modal', 'Pendapatan') THEN COALESCE(total_credit, 0) - COALESCE(total_debit, 0)
            ELSE 0
        END as balance_sum
    FROM ledger_totals;
END;
$$ LANGUAGE plpgsql;

-- Create function to update all account totals
CREATE OR REPLACE FUNCTION update_all_account_totals(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    account_rec RECORD;
    totals RECORD;
BEGIN
    FOR account_rec IN SELECT id FROM chart_of_accounts WHERE NOT is_header LOOP
        SELECT * INTO totals FROM calculate_account_totals(account_rec.id, p_start_date, p_end_date);
        
        UPDATE chart_of_accounts
        SET 
            debit_total = totals.debit_sum,
            credit_total = totals.credit_sum,
            balance_total = totals.balance_sum
        WHERE id = account_rec.id;
    END LOOP;
    
    -- Update header accounts by summing their sub-accounts
    UPDATE chart_of_accounts h
    SET 
        debit_total = COALESCE(sub.debit_sum, 0),
        credit_total = COALESCE(sub.credit_sum, 0),
        balance_total = COALESCE(sub.balance_sum, 0)
    FROM (
        SELECT 
            parent_account_id,
            SUM(debit_total) as debit_sum,
            SUM(credit_total) as credit_sum,
            SUM(balance_total) as balance_sum
        FROM chart_of_accounts
        WHERE parent_account_id IS NOT NULL
        GROUP BY parent_account_id
    ) sub
    WHERE h.id = sub.parent_account_id AND h.is_header = true;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update account totals when general_ledger changes
CREATE OR REPLACE FUNCTION update_account_totals_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the function to update all account totals
    PERFORM update_all_account_totals();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on general_ledger table
DROP TRIGGER IF EXISTS update_account_totals ON general_ledger;
CREATE TRIGGER update_account_totals
AFTER INSERT OR UPDATE OR DELETE ON general_ledger
FOR EACH STATEMENT
EXECUTE FUNCTION update_account_totals_trigger();

-- Initial calculation of totals for all accounts
SELECT update_all_account_totals();
