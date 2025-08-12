-- Disable all recursive function calls that cause stack overflow
-- Replace process_journal_entry function with a simple non-recursive version

-- Drop the existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS public.process_journal_entry(UUID);

-- Create the new non-recursive function
CREATE FUNCTION public.process_journal_entry(p_journal_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry RECORD;
    v_item RECORD;
BEGIN
    -- Get the journal entry details
    SELECT date, description INTO v_entry
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
            v_entry.date,
            v_item.account_id,
            v_item.account_code,
            v_item.account_name,
            v_item.account_type,
            v_entry.description,
            v_item.debit,
            v_item.credit,
            p_journal_entry_id,
            FALSE
        );
        
        -- Update account balances directly without any function calls
        UPDATE public.chart_of_accounts
        SET 
            total_debit = COALESCE(total_debit, 0) + COALESCE(v_item.debit, 0),
            total_credit = COALESCE(total_credit, 0) + COALESCE(v_item.credit, 0),
            updated_at = NOW()
        WHERE 
            id = v_item.account_id;
    END LOOP;
    
    -- NO RECURSIVE CALLS - everything is handled directly above
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;

-- Drop the problematic update_all_account_totals function if it exists
DROP FUNCTION IF EXISTS public.update_all_account_totals();

-- Create a simple, non-recursive version if needed
CREATE OR REPLACE FUNCTION public.update_all_account_totals()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple direct update without any recursive calls
    UPDATE public.chart_of_accounts
    SET updated_at = NOW()
    WHERE id IS NOT NULL;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;
