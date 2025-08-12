-- Create a simple function to update account balances without recursion
CREATE OR REPLACE FUNCTION public.update_account_balance(
    p_account_id UUID,
    p_debit_amount NUMERIC DEFAULT 0,
    p_credit_amount NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update account totals
    UPDATE public.chart_of_accounts
    SET 
        total_debit = COALESCE(total_debit, 0) + COALESCE(p_debit_amount, 0),
        total_credit = COALESCE(total_credit, 0) + COALESCE(p_credit_amount, 0),
        updated_at = NOW()
    WHERE 
        id = p_account_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;
