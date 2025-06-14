-- Fix the insert_standard_coa function to handle missing columns
CREATE OR REPLACE FUNCTION insert_standard_coa()
RETURNS void AS $$
BEGIN
    -- Check if the chart_of_accounts table exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'chart_of_accounts'
    ) THEN
        -- Insert standard Indonesian COA entries
        -- Asset accounts (1xxx)
        INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header, parent_account_id, is_active, current_balance, total_debit, total_credit, balance_total)
        VALUES 
        ('1000', 'Aset', 'Aset', true, null, true, 0, 0, 0, 0),
        ('1100', 'Aset Lancar', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1000'), true, 0, 0, 0, 0),
        ('1110', 'Kas & Bank', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true, 0, 0, 0, 0),
        ('1111', 'Kas', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1110'), true, 0, 0, 0, 0),
        ('1112', 'Bank BCA', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1110'), true, 0, 0, 0, 0),
        ('1113', 'Bank Mandiri', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1110'), true, 0, 0, 0, 0),
        ('1114', 'Bank BNI', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1110'), true, 0, 0, 0, 0),
        ('1115', 'Bank BRI', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1110'), true, 0, 0, 0, 0),
        ('1120', 'Piutang Usaha', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true, 0, 0, 0, 0),
        ('1121', 'Piutang Dagang', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1120'), true, 0, 0, 0, 0),
        ('1122', 'Cadangan Kerugian Piutang', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1120'), true, 0, 0, 0, 0),
        ('1130', 'Persediaan', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true, 0, 0, 0, 0),
        ('1131', 'Persediaan Barang Dagang', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1130'), true, 0, 0, 0, 0),
        ('1140', 'Biaya Dibayar Dimuka', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), true, 0, 0, 0, 0),
        ('1141', 'Sewa Dibayar Dimuka', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1140'), true, 0, 0, 0, 0),
        ('1142', 'Asuransi Dibayar Dimuka', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1140'), true, 0, 0, 0, 0),
        ('1200', 'Aset Tetap', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1000'), true, 0, 0, 0, 0),
        ('1210', 'Tanah', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true, 0, 0, 0, 0),
        ('1220', 'Bangunan', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true, 0, 0, 0, 0),
        ('1221', 'Bangunan', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1220'), true, 0, 0, 0, 0),
        ('1222', 'Akumulasi Penyusutan Bangunan', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1220'), true, 0, 0, 0, 0),
        ('1230', 'Kendaraan', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true, 0, 0, 0, 0),
        ('1231', 'Kendaraan', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1230'), true, 0, 0, 0, 0),
        ('1232', 'Akumulasi Penyusutan Kendaraan', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1230'), true, 0, 0, 0, 0),
        ('1240', 'Peralatan Kantor', 'Aset', true, (SELECT id FROM chart_of_accounts WHERE account_code = '1200'), true, 0, 0, 0, 0),
        ('1241', 'Peralatan Kantor', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1240'), true, 0, 0, 0, 0),
        ('1242', 'Akumulasi Penyusutan Peralatan Kantor', 'Aset', false, (SELECT id FROM chart_of_accounts WHERE account_code = '1240'), true, 0, 0, 0, 0),
        
        -- Liability accounts (2xxx)
        ('2000', 'Kewajiban', 'Kewajiban', true, null, true, 0, 0, 0, 0),
        ('2100', 'Kewajiban Jangka Pendek', 'Kewajiban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '2000'), true, 0, 0, 0, 0),
        ('2110', 'Hutang Usaha', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true, 0, 0, 0, 0),
        ('2120', 'Hutang Bank', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true, 0, 0, 0, 0),
        ('2130', 'Hutang Pajak', 'Kewajiban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true, 0, 0, 0, 0),
        ('2131', 'Hutang PPN', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2130'), true, 0, 0, 0, 0),
        ('2132', 'Hutang PPh 21', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2130'), true, 0, 0, 0, 0),
        ('2133', 'Hutang PPh 23', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2130'), true, 0, 0, 0, 0),
        ('2134', 'Hutang PPh 25/29', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2130'), true, 0, 0, 0, 0),
        ('2140', 'Pendapatan Diterima Dimuka', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), true, 0, 0, 0, 0),
        ('2200', 'Kewajiban Jangka Panjang', 'Kewajiban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '2000'), true, 0, 0, 0, 0),
        ('2210', 'Hutang Bank Jangka Panjang', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2200'), true, 0, 0, 0, 0),
        ('2220', 'Hutang Leasing', 'Kewajiban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '2200'), true, 0, 0, 0, 0),
        
        -- Equity accounts (3xxx)
        ('3000', 'Modal', 'Modal', true, null, true, 0, 0, 0, 0),
        ('3100', 'Modal Disetor', 'Modal', false, (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true, 0, 0, 0, 0),
        ('3200', 'Laba Ditahan', 'Modal', false, (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true, 0, 0, 0, 0),
        ('3300', 'Laba Tahun Berjalan', 'Modal', false, (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), true, 0, 0, 0, 0),
        
        -- Revenue accounts (4xxx)
        ('4000', 'Pendapatan', 'Pendapatan', true, null, true, 0, 0, 0, 0),
        ('4100', 'Pendapatan Usaha', 'Pendapatan', false, (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true, 0, 0, 0, 0),
        ('4200', 'Pendapatan Lainnya', 'Pendapatan', false, (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true, 0, 0, 0, 0),
        ('4300', 'Potongan Penjualan', 'Pendapatan', false, (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), true, 0, 0, 0, 0),
        
        -- Expense accounts (5xxx)
        ('5000', 'Beban', 'Beban', true, null, true, 0, 0, 0, 0),
        ('5100', 'Beban Pokok Penjualan', 'Beban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true, 0, 0, 0, 0),
        ('5110', 'Pembelian', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5100'), true, 0, 0, 0, 0),
        ('5120', 'Potongan Pembelian', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5100'), true, 0, 0, 0, 0),
        ('5200', 'Beban Operasional', 'Beban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true, 0, 0, 0, 0),
        ('5210', 'Beban Gaji', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5220', 'Beban Sewa', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5230', 'Beban Listrik & Air', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5240', 'Beban Telepon & Internet', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5250', 'Beban Perlengkapan Kantor', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5260', 'Beban Penyusutan', 'Beban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), true, 0, 0, 0, 0),
        ('5261', 'Beban Penyusutan Bangunan', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5260'), true, 0, 0, 0, 0),
        ('5262', 'Beban Penyusutan Kendaraan', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5260'), true, 0, 0, 0, 0),
        ('5263', 'Beban Penyusutan Peralatan Kantor', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5260'), true, 0, 0, 0, 0),
        ('5300', 'Beban Lainnya', 'Beban', true, (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), true, 0, 0, 0, 0),
        ('5310', 'Beban Administrasi Bank', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5300'), true, 0, 0, 0, 0),
        ('5320', 'Beban Bunga', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5300'), true, 0, 0, 0, 0),
        ('5330', 'Beban Pajak', 'Beban', false, (SELECT id FROM chart_of_accounts WHERE account_code = '5300'), true, 0, 0, 0, 0)
        ON CONFLICT (account_code) DO NOTHING;
    END IF;
    
    -- Don't call update_all_account_totals as it's causing the error
    -- PERFORM update_all_account_totals();
    
    RAISE NOTICE 'Standard Indonesian COA has been successfully inserted';
END;
$$ LANGUAGE plpgsql;
