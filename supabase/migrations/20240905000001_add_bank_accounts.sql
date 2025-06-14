-- Add Bank BCA and Bank Mandiri accounts to chart_of_accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_header, parent_id, balance_total, normal_balance)
VALUES 
('1111', 'Bank BCA', 'Asset', 'Rekening Bank BCA', false, NULL, 0, 'debit'),
('2222', 'Bank Mandiri', 'Asset', 'Rekening Bank Mandiri', false, NULL, 0, 'debit')
ON CONFLICT (account_code) DO NOTHING;
