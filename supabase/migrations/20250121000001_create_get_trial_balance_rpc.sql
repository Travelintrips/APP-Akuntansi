-- Create get_trial_balance RPC function that returns posted transactions only
-- with inclusive end date filtering (txn_at >= start and txn_at < end+1)

CREATE OR REPLACE FUNCTION get_trial_balance(
    p_org UUID DEFAULT NULL,
    p_start DATE DEFAULT NULL,
    p_end DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    account_id UUID,
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    account_type VARCHAR(50),
    opening_balance DECIMAL(15,2),
    period_debit DECIMAL(15,2),
    period_credit DECIMAL(15,2),
    closing_balance DECIMAL(15,2),
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    net_balance DECIMAL(15,2),
    period_start DATE,
    period_end DATE
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_end_date_exclusive DATE;
BEGIN
    -- Set default dates if not provided
    v_start_date := COALESCE(p_start, DATE_TRUNC('year', CURRENT_DATE)::DATE);
    v_end_date := COALESCE(p_end, CURRENT_DATE);
    v_end_date_exclusive := v_end_date + INTERVAL '1 day';
    
    RETURN QUERY
    WITH account_balances AS (
        SELECT 
            coa.id as account_id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            -- Opening balance: sum of all posted transactions before start date
            COALESCE(SUM(
                CASE 
                    WHEN gl.txn_at < v_start_date AND gl.is_posted = true 
                    THEN COALESCE(gl.debit, 0) - COALESCE(gl.credit, 0)
                    ELSE 0 
                END
            ), 0) as opening_balance,
            -- Period debit: sum of posted debits in the period
            COALESCE(SUM(
                CASE 
                    WHEN gl.txn_at >= v_start_date 
                         AND gl.txn_at < v_end_date_exclusive 
                         AND gl.is_posted = true 
                    THEN COALESCE(gl.debit, 0)
                    ELSE 0 
                END
            ), 0) as period_debit,
            -- Period credit: sum of posted credits in the period
            COALESCE(SUM(
                CASE 
                    WHEN gl.txn_at >= v_start_date 
                         AND gl.txn_at < v_end_date_exclusive 
                         AND gl.is_posted = true 
                    THEN COALESCE(gl.credit, 0)
                    ELSE 0 
                END
            ), 0) as period_credit
        FROM chart_of_accounts coa
        LEFT JOIN general_ledger gl ON coa.id = gl.account_id
            AND gl.is_posted = true  -- Only posted transactions
            AND (p_org IS NULL OR gl.org_id = p_org)  -- Filter by org_id if provided
        WHERE (p_org IS NULL OR coa.org_id = p_org OR coa.org_id IS NULL)  -- Filter COA by org_id if provided
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    )
    SELECT 
        gen_random_uuid() as id,
        ab.account_id,
        ab.account_code,
        ab.account_name,
        ab.account_type,
        ab.opening_balance,
        ab.period_debit,
        ab.period_credit,
        -- Closing balance = opening + period_debit - period_credit
        (ab.opening_balance + ab.period_debit - ab.period_credit) as closing_balance,
        -- Debit balance = max(closing_balance, 0)
        GREATEST(ab.opening_balance + ab.period_debit - ab.period_credit, 0) as debit_balance,
        -- Credit balance = max(-closing_balance, 0)  
        GREATEST(-(ab.opening_balance + ab.period_debit - ab.period_credit), 0) as credit_balance,
        -- Net balance = closing_balance
        (ab.opening_balance + ab.period_debit - ab.period_credit) as net_balance,
        v_start_date as period_start,
        v_end_date as period_end
    FROM account_balances ab
    WHERE (ab.opening_balance != 0 OR ab.period_debit != 0 OR ab.period_credit != 0)
    ORDER BY ab.account_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_trial_balance(UUID, DATE, DATE) TO authenticated;