-- Optimize the update_all_account_totals function to handle large datasets more efficiently
-- and prevent browser resource exhaustion

CREATE OR REPLACE FUNCTION public.update_all_account_totals(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_account_id UUID;
    v_account_cursor CURSOR FOR 
        SELECT id FROM public.chart_of_accounts;
    v_batch_size INTEGER := 50;
    v_counter INTEGER := 0;
BEGIN
    -- Process accounts in batches to prevent resource exhaustion
    OPEN v_account_cursor;
    
    LOOP
        -- Process accounts in batches
        FOR i IN 1..v_batch_size LOOP
            FETCH v_account_cursor INTO v_account_id;
            EXIT WHEN NOT FOUND;
            
            -- Update the current account's totals
            UPDATE public.chart_of_accounts
            SET 
                debit_total = COALESCE((SELECT SUM(amount) FROM public.general_ledger 
                                WHERE account_id = v_account_id 
                                AND entry_type = 'DEBIT'
                                AND (p_start_date IS NULL OR transaction_date >= p_start_date)
                                AND (p_end_date IS NULL OR transaction_date <= p_end_date)), 0),
                credit_total = COALESCE((SELECT SUM(amount) FROM public.general_ledger 
                                WHERE account_id = v_account_id 
                                AND entry_type = 'CREDIT'
                                AND (p_start_date IS NULL OR transaction_date >= p_start_date)
                                AND (p_end_date IS NULL OR transaction_date <= p_end_date)), 0)
            WHERE id = v_account_id;
            
            v_counter := v_counter + 1;
        END LOOP;
        
        -- Exit if we've processed all accounts
        EXIT WHEN v_counter % v_batch_size != 0;
        
        -- Commit the current batch to release resources
        COMMIT;
    END LOOP;
    
    CLOSE v_account_cursor;
    
    -- Update the current_balance for all accounts based on account_type
    UPDATE public.chart_of_accounts
    SET current_balance = 
        CASE 
            WHEN account_type IN ('Aset', 'Beban') THEN debit_total - credit_total
            WHEN account_type IN ('Kewajiban', 'Modal', 'Pendapatan') THEN credit_total - debit_total
            ELSE 0
        END;
 END;
$function$;