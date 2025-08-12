-- Fix schema inconsistencies and ensure proper balance calculations

-- First, add the missing foreign key constraint to journal_entry_items
ALTER TABLE public.journal_entry_items 
DROP CONSTRAINT IF EXISTS journal_entry_items_account_id_fkey;

ALTER TABLE public.journal_entry_items 
ADD CONSTRAINT journal_entry_items_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id);

-- Also add foreign key to journal_entries
ALTER TABLE public.journal_entry_items 
DROP CONSTRAINT IF EXISTS journal_entry_items_journal_entry_id_fkey;

ALTER TABLE public.journal_entry_items 
ADD CONSTRAINT journal_entry_items_journal_entry_id_fkey 
FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;

-- Ensure the general_ledger table has the correct structure
CREATE TABLE IF NOT EXISTS public.general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    description TEXT,
    debit DECIMAL(18, 2) DEFAULT 0,
    credit DECIMAL(18, 2) DEFAULT 0,
    balance DECIMAL(18, 2) DEFAULT 0,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    manual_entry BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ensure chart_of_accounts has all necessary columns
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS total_debit DECIMAL(18, 2) DEFAULT 0;

ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS total_credit DECIMAL(18, 2) DEFAULT 0;

ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS balance_total DECIMAL(18, 2) DEFAULT 0;

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.process_journal_entry(UUID);

-- Fix the process_journal_entry function
CREATE OR REPLACE FUNCTION public.process_journal_entry(p_journal_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_entry_date DATE;
    v_description TEXT;
    v_current_balance DECIMAL(18, 2);
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
        -- Get current balance for the account
        SELECT COALESCE(balance_total, 0) INTO v_current_balance
        FROM public.chart_of_accounts
        WHERE id = v_item.account_id;
        
        -- Calculate new balance based on account type
        IF v_item.account_type IN ('Aset', 'Beban') THEN
            -- For asset and expense accounts: debit increases, credit decreases
            v_current_balance := v_current_balance + COALESCE(v_item.debit, 0) - COALESCE(v_item.credit, 0);
        ELSE
            -- For liability, equity, and revenue accounts: credit increases, debit decreases
            v_current_balance := v_current_balance - COALESCE(v_item.debit, 0) + COALESCE(v_item.credit, 0);
        END IF;
        
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
            balance,
            journal_entry_id,
            manual_entry
        ) VALUES (
            v_entry_date,
            v_item.account_id,
            v_item.account_code,
            v_item.account_name,
            v_item.account_type,
            v_description,
            COALESCE(v_item.debit, 0),
            COALESCE(v_item.credit, 0),
            v_current_balance,
            p_journal_entry_id,
            FALSE
        );
        
        -- Update account balances in chart_of_accounts
        UPDATE public.chart_of_accounts
        SET 
            total_debit = COALESCE(total_debit, 0) + COALESCE(v_item.debit, 0),
            total_credit = COALESCE(total_credit, 0) + COALESCE(v_item.credit, 0),
            balance_total = v_current_balance
        WHERE 
            id = v_item.account_id;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;

-- Create a function to recalculate all account balances
CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_account RECORD;
    v_total_debit DECIMAL(18, 2);
    v_total_credit DECIMAL(18, 2);
    v_balance DECIMAL(18, 2);
BEGIN
    -- Loop through all accounts
    FOR v_account IN 
        SELECT id, account_code, account_name, account_type 
        FROM public.chart_of_accounts
        WHERE is_header = FALSE
        ORDER BY account_code
    LOOP
        -- Calculate total debits and credits for this account
        SELECT 
            COALESCE(SUM(debit), 0) AS total_debit,
            COALESCE(SUM(credit), 0) AS total_credit
        INTO v_total_debit, v_total_credit
        FROM public.general_ledger
        WHERE account_id = v_account.id;
        
        -- Calculate balance based on account type
        IF v_account.account_type IN ('Aset', 'Beban') THEN
            -- For asset and expense accounts: debit increases, credit decreases
            v_balance := v_total_debit - v_total_credit;
        ELSE
            -- For liability, equity, and revenue accounts: credit increases, debit decreases
            v_balance := v_total_credit - v_total_debit;
        END IF;
        
        -- Update the account with new totals
        UPDATE public.chart_of_accounts
        SET 
            total_debit = v_total_debit,
            total_credit = v_total_credit,
            balance_total = v_balance
        WHERE id = v_account.id;
    END LOOP;
END;
$$;

-- Enable realtime for all relevant tables (only if not already added)
DO $$
BEGIN
    -- Add tables to realtime publication if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chart_of_accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'journal_entries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'journal_entry_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entry_items;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'general_ledger'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.general_ledger;
    END IF;
END $$;

-- Run the recalculation function to fix existing data
SELECT public.recalculate_all_balances();