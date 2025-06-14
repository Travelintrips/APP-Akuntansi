-- Insert standard accounts if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chart_of_accounts LIMIT 1) THEN
    -- Asset accounts
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('1000', 'ASET', 'ASSET', TRUE, 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('1100', 'Aset Lancar', 'ASSET', TRUE, 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('1110', 'Kas', 'ASSET', (SELECT id FROM public.chart_of_accounts WHERE account_code = '1100'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('1120', 'Bank', 'ASSET', (SELECT id FROM public.chart_of_accounts WHERE account_code = '1100'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('1130', 'Piutang Usaha', 'ASSET', (SELECT id FROM public.chart_of_accounts WHERE account_code = '1100'), 'DEBIT');
    
    -- Liability accounts
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('2000', 'KEWAJIBAN', 'LIABILITY', TRUE, 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('2100', 'Kewajiban Lancar', 'LIABILITY', TRUE, 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('2110', 'Hutang Usaha', 'LIABILITY', (SELECT id FROM public.chart_of_accounts WHERE account_code = '2100'), 'CREDIT');
    
    -- Equity accounts
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('3000', 'EKUITAS', 'EQUITY', TRUE, 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('3100', 'Modal', 'EQUITY', (SELECT id FROM public.chart_of_accounts WHERE account_code = '3000'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('3200', 'Laba Ditahan', 'EQUITY', (SELECT id FROM public.chart_of_accounts WHERE account_code = '3000'), 'CREDIT');
    
    -- Revenue accounts
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('4000', 'PENDAPATAN', 'REVENUE', TRUE, 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4100', 'Pendapatan Jasa', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4000'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4110', 'Pendapatan Tiket Pesawat', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4100'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4120', 'Pendapatan Hotel', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4100'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4130', 'Pendapatan Passenger Handling', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4100'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4140', 'Pendapatan Travel', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4100'), 'CREDIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('4150', 'Pendapatan Rental Car', 'REVENUE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '4100'), 'CREDIT');
    
    -- Expense accounts
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, is_header, normal_balance) 
    VALUES ('5000', 'BEBAN', 'EXPENSE', TRUE, 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5100', 'Beban Operasional', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5000'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5110', 'Beban Gaji', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5100'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5120', 'Beban Sewa', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5100'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5130', 'Beban Utilitas', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5100'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5200', 'Harga Pokok Penjualan', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5000'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5210', 'HPP Tiket Pesawat', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5200'), 'DEBIT');
    
    INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, parent_id, normal_balance) 
    VALUES ('5220', 'HPP Hotel', 'EXPENSE', (SELECT id FROM public.chart_of_accounts WHERE account_code = '5200'), 'DEBIT');
  END IF;
END
$$;
