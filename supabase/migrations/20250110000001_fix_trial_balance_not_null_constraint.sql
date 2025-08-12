-- Fix trial balance not-null constraint violation on account_code
-- Update the populate_trial_balance function to exclude rows with null account_code

CREATE OR REPLACE FUNCTION populate_trial_balance(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS VOID AS $$
BEGIN
    -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
    -- Add WHERE clause to exclude rows with null account_code
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

-- Also update the get_trial_balance_summary function to be more robust
CREATE OR REPLACE FUNCTION get_trial_balance_summary(
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
        -- Cross-check with general ledger totals
        COALESCE((SELECT SUM(gl.debit) FROM general_ledger gl 
                  WHERE gl.date >= p_period_start AND gl.date <= p_period_end
                  AND gl.debit IS NOT NULL), 0) as gl_total_debit,
        COALESCE((SELECT SUM(gl.credit) FROM general_ledger gl 
                  WHERE gl.date >= p_period_start AND gl.date <= p_period_end
                  AND gl.credit IS NOT NULL), 0) as gl_total_credit
    FROM trial_balance tb
    WHERE tb.period_start = p_period_start 
        AND tb.period_end = p_period_end
        AND tb.account_code IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Clean up any existing trial balance entries with null account_code
DELETE FROM trial_balance WHERE account_code IS NULL OR account_name IS NULL;
