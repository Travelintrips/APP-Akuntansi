-- Add missing account codes for proper accounting integration
-- First check if Pendapatan Tiket Pesawat account exists, if not create it
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_header, parent_id, balance_total, normal_balance)
VALUES ('4101', 'Pendapatan Tiket Pesawat', 'Revenue', 'Pendapatan dari penjualan tiket pesawat', false, NULL, 0, 'credit')
ON CONFLICT (account_code) DO NOTHING;

-- Check if Kas account exists, if not create it
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_header, parent_id, balance_total, normal_balance)
VALUES ('1101', 'Kas', 'Asset', 'Kas tunai perusahaan', false, NULL, 0, 'debit')
ON CONFLICT (account_code) DO NOTHING;

-- Add other sub-account related accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, is_header, parent_id, balance_total, normal_balance)
VALUES 
('4102', 'Pendapatan Hotel', 'Revenue', 'Pendapatan dari penjualan kamar hotel', false, NULL, 0, 'credit'),
('4103', 'Pendapatan Passenger Handling', 'Revenue', 'Pendapatan dari layanan passenger handling', false, NULL, 0, 'credit'),
('4104', 'Pendapatan Travel', 'Revenue', 'Pendapatan dari paket travel', false, NULL, 0, 'credit'),
('4105', 'Pendapatan Airport Transfer', 'Revenue', 'Pendapatan dari layanan airport transfer', false, NULL, 0, 'credit'),
('4106', 'Pendapatan Rental Mobil', 'Revenue', 'Pendapatan dari rental mobil', false, NULL, 0, 'credit')
ON CONFLICT (account_code) DO NOTHING;
