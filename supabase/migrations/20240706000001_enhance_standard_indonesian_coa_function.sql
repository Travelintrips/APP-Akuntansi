-- Function to insert standard Indonesian Chart of Accounts
CREATE OR REPLACE FUNCTION insert_standard_coa()
RETURNS void AS $$
BEGIN
    -- Check if the chart_of_accounts table exists before trying to add it to realtime
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'chart_of_accounts'
    ) THEN
        -- Only add to realtime publication if the table exists
        ALTER PUBLICATION supabase_realtime ADD TABLE chart_of_accounts;
    END IF;

    -- Insert standard Indonesian COA entries
    -- This will only run if the table exists, otherwise it will be skipped
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'chart_of_accounts'
    ) THEN
        -- Asset accounts (1xxx)
        INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header, parent_account_id)
        VALUES 
        ('1000', 'Aset', 'Aset', true, null),
        ('1100', 'Aset Lancar', 'Aset', true, '1000'),
        ('1110', 'Kas & Bank', 'Aset', true, '1100'),
        ('1111', 'Kas', 'Aset', false, '1110'),
        ('1112', 'Bank BCA', 'Aset', false, '1110'),
        ('1113', 'Bank Mandiri', 'Aset', false, '1110'),
        ('1114', 'Bank BNI', 'Aset', false, '1110'),
        ('1115', 'Bank BRI', 'Aset', false, '1110'),
        ('1120', 'Piutang Usaha', 'Aset', true, '1100'),
        ('1121', 'Piutang Dagang', 'Aset', false, '1120'),
        ('1122', 'Cadangan Kerugian Piutang', 'Aset', false, '1120'),
        ('1130', 'Persediaan', 'Aset', true, '1100'),
        ('1131', 'Persediaan Barang Dagang', 'Aset', false, '1130'),
        ('1140', 'Biaya Dibayar Dimuka', 'Aset', true, '1100'),
        ('1141', 'Sewa Dibayar Dimuka', 'Aset', false, '1140'),
        ('1142', 'Asuransi Dibayar Dimuka', 'Aset', false, '1140'),
        ('1200', 'Aset Tetap', 'Aset', true, '1000'),
        ('1210', 'Tanah', 'Aset', false, '1200'),
        ('1220', 'Bangunan', 'Aset', true, '1200'),
        ('1221', 'Bangunan', 'Aset', false, '1220'),
        ('1222', 'Akumulasi Penyusutan Bangunan', 'Aset', false, '1220'),
        ('1230', 'Kendaraan', 'Aset', true, '1200'),
        ('1231', 'Kendaraan', 'Aset', false, '1230'),
        ('1232', 'Akumulasi Penyusutan Kendaraan', 'Aset', false, '1230'),
        ('1240', 'Peralatan Kantor', 'Aset', true, '1200'),
        ('1241', 'Peralatan Kantor', 'Aset', false, '1240'),
        ('1242', 'Akumulasi Penyusutan Peralatan Kantor', 'Aset', false, '1240'),
        
        -- Liability accounts (2xxx)
        ('2000', 'Kewajiban', 'Kewajiban', true, null),
        ('2100', 'Kewajiban Jangka Pendek', 'Kewajiban', true, '2000'),
        ('2110', 'Hutang Usaha', 'Kewajiban', false, '2100'),
        ('2120', 'Hutang Bank', 'Kewajiban', false, '2100'),
        ('2130', 'Hutang Pajak', 'Kewajiban', true, '2100'),
        ('2131', 'Hutang PPN', 'Kewajiban', false, '2130'),
        ('2132', 'Hutang PPh 21', 'Kewajiban', false, '2130'),
        ('2133', 'Hutang PPh 23', 'Kewajiban', false, '2130'),
        ('2134', 'Hutang PPh 25/29', 'Kewajiban', false, '2130'),
        ('2140', 'Pendapatan Diterima Dimuka', 'Kewajiban', false, '2100'),
        ('2200', 'Kewajiban Jangka Panjang', 'Kewajiban', true, '2000'),
        ('2210', 'Hutang Bank Jangka Panjang', 'Kewajiban', false, '2200'),
        ('2220', 'Hutang Leasing', 'Kewajiban', false, '2200'),
        
        -- Equity accounts (3xxx)
        ('3000', 'Modal', 'Modal', true, null),
        ('3100', 'Modal Disetor', 'Modal', false, '3000'),
        ('3200', 'Laba Ditahan', 'Modal', false, '3000'),
        ('3300', 'Laba Tahun Berjalan', 'Modal', false, '3000'),
        
        -- Revenue accounts (4xxx)
        ('4000', 'Pendapatan', 'Pendapatan', true, null),
        ('4100', 'Pendapatan Usaha', 'Pendapatan', false, '4000'),
        ('4200', 'Pendapatan Lainnya', 'Pendapatan', false, '4000'),
        ('4300', 'Potongan Penjualan', 'Pendapatan', false, '4000'),
        
        -- Expense accounts (5xxx)
        ('5000', 'Beban', 'Beban', true, null),
        ('5100', 'Beban Pokok Penjualan', 'Beban', true, '5000'),
        ('5110', 'Pembelian', 'Beban', false, '5100'),
        ('5120', 'Potongan Pembelian', 'Beban', false, '5100'),
        ('5200', 'Beban Operasional', 'Beban', true, '5000'),
        ('5210', 'Beban Gaji', 'Beban', false, '5200'),
        ('5220', 'Beban Sewa', 'Beban', false, '5200'),
        ('5230', 'Beban Listrik & Air', 'Beban', false, '5200'),
        ('5240', 'Beban Telepon & Internet', 'Beban', false, '5200'),
        ('5250', 'Beban Perlengkapan Kantor', 'Beban', false, '5200'),
        ('5260', 'Beban Penyusutan', 'Beban', true, '5200'),
        ('5261', 'Beban Penyusutan Bangunan', 'Beban', false, '5260'),
        ('5262', 'Beban Penyusutan Kendaraan', 'Beban', false, '5260'),
        ('5263', 'Beban Penyusutan Peralatan Kantor', 'Beban', false, '5260'),
        ('5300', 'Beban Lainnya', 'Beban', true, '5000'),
        ('5310', 'Beban Administrasi Bank', 'Beban', false, '5300'),
        ('5320', 'Beban Bunga', 'Beban', false, '5300'),
        ('5330', 'Beban Pajak', 'Beban', false, '5300')
        ON CONFLICT (account_code) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;
