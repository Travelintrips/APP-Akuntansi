-- Update trial balance calculation to use ledger_summaries instead of general_ledger
-- Add new columns to trial_balance table to match the new calculation requirements

-- Add new columns to trial_balance table if they don't exist
ALTER TABLE trial_balance 
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS period_debit DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS period_credit DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS closing_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;

-- Update the populate_trial_balance function to use ledger_summaries
CREATE OR REPLACE FUNCTION populate_trial_balance_from_ledger_summaries(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS VOID AS $$
DECLARE
    v_period_string TEXT;
BEGIN
    -- Extract period string (YYYY-MM) from start date
    v_period_string := TO_CHAR(p_period_start, 'YYYY-MM');
    
    -- Delete existing entries for this period
    DELETE FROM trial_balance 
    WHERE period_start = p_period_start AND period_end = p_period_end;
    
    -- Insert trial balance data from ledger_summaries
    INSERT INTO trial_balance (
        period_start,
        period_end,
        account_id,
        account_code,
        account_name,
        opening_balance,
        period_debit,
        period_credit,
        closing_balance,
        debit_balance,
        credit_balance,
        balance,
        net_balance,
        created_at,
        updated_at
    )
    SELECT 
        p_period_start,
        p_period_end,
        coa.id,
        ls.account_code,
        COALESCE(ls.account_name, coa.account_name) as account_name,
        COALESCE(ls.opening_balance, 0) as opening_balance,
        COALESCE(ls.total_debit, 0) as period_debit,
        COALESCE(ls.total_credit, 0) as period_credit,
        -- Calculate closing balance: opening_balance + total_debit - total_credit
        COALESCE(ls.opening_balance, 0) + COALESCE(ls.total_debit, 0) - COALESCE(ls.total_credit, 0) as closing_balance,
        -- debit_balance = max(closing_balance, 0)
        GREATEST(COALESCE(ls.opening_balance, 0) + COALESCE(ls.total_debit, 0) - COALESCE(ls.total_credit, 0), 0) as debit_balance,
        -- credit_balance = max(-closing_balance, 0)
        GREATEST(-(COALESCE(ls.opening_balance, 0) + COALESCE(ls.total_debit, 0) - COALESCE(ls.total_credit, 0)), 0) as credit_balance,
        -- balance = closing_balance
        COALESCE(ls.opening_balance, 0) + COALESCE(ls.total_debit, 0) - COALESCE(ls.total_credit, 0) as balance,
        -- net_balance = closing_balance
        COALESCE(ls.opening_balance, 0) + COALESCE(ls.total_debit, 0) - COALESCE(ls.total_credit, 0) as net_balance,
        NOW() as created_at,
        NOW() as updated_at
    FROM ledger_summaries ls
    INNER JOIN chart_of_accounts coa ON ls.account_code = coa.account_code
    WHERE ls.period = v_period_string
    AND (COALESCE(ls.opening_balance, 0) != 0 
         OR COALESCE(ls.total_debit, 0) != 0 
         OR COALESCE(ls.total_credit, 0) != 0)
    ORDER BY ls.account_code;
    
END;
$$ LANGUAGE plpgsql;

-- Update the sync function to use the new ledger summaries approach
CREATE OR REPLACE FUNCTION sync_trial_balance_with_ledger_summaries(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    synced_accounts INTEGER,
    total_debit DECIMAL(15,2),
    total_credit DECIMAL(15,2)
) AS $$
DECLARE
    v_synced_count INTEGER;
BEGIN
    -- Populate/refresh the trial balance using ledger summaries
    PERFORM populate_trial_balance_from_ledger_summaries(p_period_start, p_period_end);
    
    -- Get the count of synced accounts
    SELECT COUNT(*) INTO v_synced_count
    FROM trial_balance tb
    WHERE tb.period_start = p_period_start AND tb.period_end = p_period_end;
    
    -- Return summary
    RETURN QUERY
    SELECT 
        v_synced_count as synced_accounts,
        COALESCE(SUM(tb.debit_balance), 0) as total_debit,
        COALESCE(SUM(tb.credit_balance), 0) as total_credit
    FROM trial_balance tb
    WHERE tb.period_start = p_period_start AND tb.period_end = p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get trial balance summary from ledger summaries
CREATE OR REPLACE FUNCTION get_trial_balance_summary_from_ledger(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    total_debit DECIMAL(15,2),
    total_credit DECIMAL(15,2),
    is_balanced BOOLEAN,
    record_count INTEGER,
    gl_total_debit DECIMAL(15,2),
    gl_total_credit DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(tb.debit_balance), 0) as total_debit,
        COALESCE(SUM(tb.credit_balance), 0) as total_credit,
        COALESCE(SUM(tb.debit_balance), 0) = COALESCE(SUM(tb.credit_balance), 0) as is_balanced,
        COUNT(tb.id)::INTEGER as record_count,
        -- For compatibility, return the same values as debit/credit totals
        COALESCE(SUM(tb.debit_balance), 0) as gl_total_debit,
        COALESCE(SUM(tb.credit_balance), 0) as gl_total_credit
    FROM trial_balance tb
    WHERE tb.period_start = p_period_start AND tb.period_end = p_period_end;
END;
$$ LANGUAGE plpgsql;
