-- Create trial balance (neraca saldo) table
CREATE TABLE IF NOT EXISTS trial_balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    debit_balance DECIMAL(15,2) DEFAULT 0,
    credit_balance DECIMAL(15,2) DEFAULT 0,
    net_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint to ensure period consistency
    CONSTRAINT chk_trial_balance_period CHECK (period_end >= period_start),
    -- Add unique constraint to prevent duplicate entries for same account and period
    CONSTRAINT uk_trial_balance_account_period UNIQUE (account_id, period_start, period_end)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trial_balance_account_id ON trial_balance(account_id);
CREATE INDEX IF NOT EXISTS idx_trial_balance_period ON trial_balance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_trial_balance_account_code ON trial_balance(account_code);

-- Enable realtime for trial_balance table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'trial_balance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE trial_balance;
    END IF;
END $$;

-- Create function to populate trial balance from general ledger
CREATE OR REPLACE FUNCTION populate_trial_balance(
    p_period_start DATE,
    p_period_end DATE
)
RETURNS VOID AS $$
BEGIN
    -- Clear existing trial balance for the period
    DELETE FROM trial_balance 
    WHERE period_start = p_period_start AND period_end = p_period_end;
    
    -- Insert trial balance data from general ledger with proper GL connection
    INSERT INTO trial_balance (
        period_start,
        period_end,
        account_id,
        account_code,
        account_name,
        debit_balance,
        credit_balance,
        net_balance
    )
    SELECT 
        p_period_start,
        p_period_end,
        coa.id,
        coa.account_code,
        coa.account_name,
        COALESCE(SUM(CASE WHEN gl.debit > 0 THEN gl.debit ELSE 0 END), 0) as debit_balance,
        COALESCE(SUM(CASE WHEN gl.credit > 0 THEN gl.credit ELSE 0 END), 0) as credit_balance,
        COALESCE(SUM(COALESCE(gl.debit, 0) - COALESCE(gl.credit, 0)), 0) as net_balance
    FROM chart_of_accounts coa
    LEFT JOIN general_ledger gl ON coa.id = gl.account_id 
        AND gl.date >= p_period_start 
        AND gl.date <= p_period_end
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    HAVING COALESCE(SUM(COALESCE(gl.debit, 0)), 0) > 0 
        OR COALESCE(SUM(COALESCE(gl.credit, 0)), 0) > 0
    ORDER BY coa.account_code;
    
    -- Update the updated_at timestamp
    UPDATE trial_balance 
    SET updated_at = NOW() 
    WHERE period_start = p_period_start AND period_end = p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Create function to get trial balance summary with GL validation
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
                  WHERE gl.date >= p_period_start AND gl.date <= p_period_end), 0) as gl_total_debit,
        COALESCE((SELECT SUM(gl.credit) FROM general_ledger gl 
                  WHERE gl.date >= p_period_start AND gl.date <= p_period_end), 0) as gl_total_credit
    FROM trial_balance tb
    WHERE tb.period_start = p_period_start AND tb.period_end = p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync trial balance with current general ledger data
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
    -- First populate/refresh the trial balance
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