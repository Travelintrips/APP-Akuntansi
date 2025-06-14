-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS process_journal_entry;

-- Recreate the function with the correct parameter references
CREATE OR REPLACE FUNCTION process_journal_entry(p_journal_entry_id UUID)
RETURNS VOID AS $$
DECLARE
    v_entry_date DATE;
    v_entry_item RECORD;
    v_account_type TEXT;
BEGIN
    -- Get the journal entry date
    SELECT date INTO v_entry_date
    FROM journal_entries
    WHERE id = p_journal_entry_id;
    
    -- Process each journal entry item
    FOR v_entry_item IN (
        SELECT 
            jei.account_id,
            jei.debit,
            jei.credit,
            coa.account_type
        FROM 
            journal_entry_items jei
        JOIN 
            chart_of_accounts coa ON jei.account_id = coa.id
        WHERE 
            jei.journal_entry_id = p_journal_entry_id
    ) LOOP
        -- Get the account type for balance calculation
        v_account_type := v_entry_item.account_type;
        
        -- Insert into general ledger
        INSERT INTO general_ledger (
            entry_date,
            journal_entry_id,
            account_id,
            debit,
            credit,
            current_balance
        )
        SELECT
            v_entry_date,
            p_journal_entry_id,
            v_entry_item.account_id,
            v_entry_item.debit,
            v_entry_item.credit,
            COALESCE(
                (
                    SELECT
                        CASE
                            WHEN v_account_type IN ('ASSET', 'EXPENSE') THEN
                                current_balance + (v_entry_item.debit - v_entry_item.credit)
                            ELSE
                                current_balance + (v_entry_item.credit - v_entry_item.debit)
                        END
                    FROM
                        general_ledger
                    WHERE
                        account_id = v_entry_item.account_id
                    ORDER BY
                        entry_date DESC, created_at DESC
                    LIMIT 1
                ),
                CASE
                    WHEN v_account_type IN ('ASSET', 'EXPENSE') THEN
                        (v_entry_item.debit - v_entry_item.credit)
                    ELSE
                        (v_entry_item.credit - v_entry_item.debit)
                END
            );
            
        -- Update the account balance in chart_of_accounts
        UPDATE chart_of_accounts
        SET 
            total_debit = total_debit + v_entry_item.debit,
            total_credit = total_credit + v_entry_item.credit,
            current_balance = 
                CASE
                    WHEN v_account_type IN ('ASSET', 'EXPENSE') THEN
                        current_balance + (v_entry_item.debit - v_entry_item.credit)
                    ELSE
                        current_balance + (v_entry_item.credit - v_entry_item.debit)
                END
        WHERE 
            id = v_entry_item.account_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;