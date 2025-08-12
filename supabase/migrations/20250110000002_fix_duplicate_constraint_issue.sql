-- Fix duplicate key constraint issue in trial balance
-- Drop all existing unique constraints and indexes that might be causing conflicts

-- Drop the existing unique constraint if it exists
ALTER TABLE trial_balance DROP CONSTRAINT IF EXISTS uk_trial_balance_account_period;
ALTER TABLE trial_balance DROP CONSTRAINT IF EXISTS unique_trial_balance_account_period;

-- Drop any existing unique indexes
DROP INDEX IF EXISTS idx_trial_balance_unique_account_period;
DROP INDEX IF EXISTS unique_trial_balance_account_period;

-- Update the populate_trial_balance function to use UPSERT with a simpler approach
CREATE OR REPLACE FUNCTION populate_trial_balance(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS VOID AS $$
BEGIN
    -- First, delete existing entries for this period to avoid conflicts
    DELETE FROM trial_balance 
    WHERE period_start = p_period_start AND period_end = p_period_end;
    
    -- Insert fresh trial balance data from general ledger
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
    WHERE coa.account_code IS NOT NULL 
        AND coa.account_name IS NOT NULL
        AND coa.id IS NOT NULL
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    HAVING COALESCE(SUM(COALESCE(gl.debit, 0)), 0) > 0 
        OR COALESCE(SUM(COALESCE(gl.credit, 0)), 0) > 0
    ORDER BY coa.account_code;
END;
$$ LANGUAGE plpgsql;

-- Create a non-unique index for performance (not enforcing uniqueness)
CREATE INDEX IF NOT EXISTS idx_trial_balance_account_period_lookup 
ON trial_balance (account_id, period_start, period_end);

-- Update the sync function to use the new approach
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
    -- Populate/refresh the trial balance using the updated function
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

-- Clean up any existing duplicate entries
DELETE FROM trial_balance a USING trial_balance b 
WHERE a.id > b.id 
    AND a.account_id = b.account_id 
    AND a.period_start = b.period_start 
    AND a.period_end = b.period_end;
