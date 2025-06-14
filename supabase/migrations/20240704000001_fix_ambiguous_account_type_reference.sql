-- Fix ambiguous account_type reference in process_journal_entry function
CREATE OR REPLACE FUNCTION process_journal_entry(p_journal_entry_id UUID)
RETURNS VOID AS $$
DECLARE
    v_journal_entry RECORD;
    v_journal_item RECORD;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_account_type TEXT;
BEGIN
    -- Get journal entry details
    SELECT * INTO v_journal_entry FROM journal_entries WHERE id = p_journal_entry_id;
    
    -- Process each journal entry item
    FOR v_journal_item IN (
        SELECT * FROM journal_entry_items WHERE journal_entry_id = p_journal_entry_id
    ) LOOP
        -- Get account type from chart of accounts
        SELECT coa.account_type INTO v_account_type 
        FROM chart_of_accounts coa 
        WHERE coa.id = v_journal_item.account_id;
        
        -- Get current balance for this account
        SELECT COALESCE(
            (SELECT balance FROM general_ledger 
             WHERE account_id = v_journal_item.account_id 
             ORDER BY date DESC, created_at DESC 
             LIMIT 1),
            0
        ) INTO v_current_balance;
        
        -- Calculate new balance based on account type
        IF v_account_type IN ('Aset', 'Beban') THEN
            -- For asset and expense accounts: debit increases, credit decreases
            v_new_balance := v_current_balance + v_journal_item.debit - v_journal_item.credit;
        ELSE
            -- For liability, equity, and revenue accounts: credit increases, debit decreases
            v_new_balance := v_current_balance - v_journal_item.debit + v_journal_item.credit;
        END IF;
        
        -- Insert into general ledger
        INSERT INTO general_ledger (
            account_id,
            date,
            description,
            debit,
            credit,
            balance,
            journal_entry_id
        ) VALUES (
            v_journal_item.account_id,
            v_journal_entry.date,
            v_journal_entry.description,
            v_journal_item.debit,
            v_journal_item.credit,
            v_new_balance,
            p_journal_entry_id
        );
        
        -- Update account balance in chart_of_accounts
        UPDATE chart_of_accounts
        SET 
            total_debit = COALESCE(total_debit, 0) + v_journal_item.debit,
            total_credit = COALESCE(total_credit, 0) + v_journal_item.credit,
            balance_total = v_new_balance
        WHERE id = v_journal_item.account_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;