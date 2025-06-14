-- Fix the update_all_account_totals function to handle the correct column names
CREATE OR REPLACE FUNCTION update_all_account_totals(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_account RECORD;
    v_total_debit DECIMAL(18, 2);
    v_total_credit DECIMAL(18, 2);
    v_balance DECIMAL(18, 2);
BEGIN
    -- Loop through all accounts
    FOR v_account IN 
        SELECT id, account_code, account_name, account_type 
        FROM chart_of_accounts
        ORDER BY account_code
    LOOP
        -- Calculate total debits and credits for this account within date range
        SELECT 
            COALESCE(SUM(debit), 0) AS total_debit,
            COALESCE(SUM(credit), 0) AS total_credit
        INTO v_total_debit, v_total_credit
        FROM general_ledger
        WHERE account_id = v_account.id
        AND (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date);
        
        -- Calculate balance based on account type
        IF v_account.account_type IN ('Aset', 'Beban') THEN
            -- For asset and expense accounts: debit increases, credit decreases
            v_balance := v_total_debit - v_total_credit;
        ELSE
            -- For liability, equity, and revenue accounts: credit increases, debit decreases
            v_balance := v_total_credit - v_total_debit;
        END IF;
        
        -- Update the account with new totals
        UPDATE chart_of_accounts
        SET 
            total_debit = v_total_debit,
            total_credit = v_total_credit,
            balance_total = v_balance,
            current_balance = v_balance  -- Also update current_balance for consistency
        WHERE id = v_account.id;
    END LOOP;
    
    RAISE NOTICE 'All account totals have been updated successfully';
END;
$$ LANGUAGE plpgsql;
