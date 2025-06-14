-- Create the process_journal_entry function
CREATE OR REPLACE FUNCTION public.process_journal_entry(p_journal_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry RECORD;
    v_item RECORD;
    v_account_code TEXT;
    v_account_name TEXT;
    v_account_type TEXT;
    v_entry_date DATE;
    v_description TEXT;
BEGIN
    -- Get the journal entry details
    SELECT date, description INTO v_entry_date, v_description
    FROM public.journal_entries
    WHERE id = p_journal_entry_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journal entry with ID % not found', p_journal_entry_id;
    END IF;
    
    -- Process each journal entry item
    FOR v_item IN (
        SELECT 
            jei.id,
            jei.account_id,
            jei.debit,
            jei.credit,
            coa.account_code,
            coa.account_name,
            coa.account_type
        FROM 
            public.journal_entry_items jei
            JOIN public.chart_of_accounts coa ON jei.account_id = coa.id
        WHERE 
            jei.journal_entry_id = p_journal_entry_id
    ) LOOP
        -- Insert into general ledger
        INSERT INTO public.general_ledger (
            date,
            account_id,
            account_code,
            account_name,
            account_type,
            description,
            debit,
            credit,
            journal_entry_id,
            is_manual_entry
        ) VALUES (
            v_entry_date,
            v_item.account_id,
            v_item.account_code,
            v_item.account_name,
            v_item.account_type,
            v_description,
            v_item.debit,
            v_item.credit,
            p_journal_entry_id,
            FALSE
        );
        
        -- Update account balances in chart_of_accounts
        UPDATE public.chart_of_accounts
        SET 
            total_debit = COALESCE(total_debit, 0) + COALESCE(v_item.debit, 0),
            total_credit = COALESCE(total_credit, 0) + COALESCE(v_item.credit, 0)
        WHERE 
            id = v_item.account_id;
    END LOOP;
    
    -- Call the function to update all account totals
    PERFORM update_all_account_totals(NULL, NULL);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;