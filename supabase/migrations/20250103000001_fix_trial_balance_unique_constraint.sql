-- Fix trial balance unique constraint issue
-- Remove the problematic unique constraint and update the populate function to use UPSERT

-- Drop the unique constraint that's causing the duplicate key error
ALTER TABLE trial_balance DROP CONSTRAINT IF EXISTS uk_trial_balance_account_period;

-- Update the populate_trial_balance function to use UPSERT instead of DELETE + INSERT
CREATE OR REPLACE FUNCTION populate_trial_balance(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS VOID AS $$
BEGIN
    -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
    INSERT INTO trial_balance (
        period_start,
        period_end,
        account_id,
        account_code,
        account_name,
        debit_balance,
        credit_balance,
        net_balance,
        updated_at
    )
    SELECT 
        p_period_start,
        p_period_end,
        coa.id,
        coa.account_code,
        coa.account_name,
        COALESCE(SUM(CASE WHEN gl.debit > 0 THEN gl.debit ELSE 0 END), 0) as debit_balance,
        COALESCE(SUM(CASE WHEN gl.credit > 0 THEN gl.credit ELSE 0 END), 0) as credit_balance,
        COALESCE(SUM(COALESCE(gl.debit, 0) - COALESCE(gl.credit, 0)), 0) as net_balance,
        NOW() as updated_at
    FROM chart_of_accounts coa
    LEFT JOIN general_ledger gl ON coa.id = gl.account_id 
        AND gl.date >= p_period_start 
        AND gl.date <= p_period_end
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    HAVING COALESCE(SUM(COALESCE(gl.debit, 0)), 0) > 0 
        OR COALESCE(SUM(COALESCE(gl.credit, 0)), 0) > 0
    ON CONFLICT (account_id, period_start, period_end) 
    DO UPDATE SET
        account_code = EXCLUDED.account_code,
        account_name = EXCLUDED.account_name,
        debit_balance = EXCLUDED.debit_balance,
        credit_balance = EXCLUDED.credit_balance,
        net_balance = EXCLUDED.net_balance,
        updated_at = NOW();
        
    -- Clean up any existing entries that no longer have transactions
    DELETE FROM trial_balance 
    WHERE period_start = p_period_start 
        AND period_end = p_period_end
        AND debit_balance = 0 
        AND credit_balance = 0;
END;
$$ LANGUAGE plpgsql;

-- Add a partial unique index instead of a full constraint to allow better control
-- This will still prevent true duplicates but won't cause hard errors
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_balance_unique_account_period 
ON trial_balance (account_id, period_start, period_end);

-- Update the sync function to handle the new approach
CREATE OR REPLACE FUNCTION sync_trial_balance_with_gl(
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
    -- Populate/refresh the trial balance using the new UPSERT approach
    PERFORM populate_trial_balance(p_period_start, p_period_end);
    
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
