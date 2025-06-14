-- Create a function to insert standard Indonesian COA data
CREATE OR REPLACE FUNCTION insert_standard_coa()
RETURNS void AS $$
DECLARE
    aset_id UUID;
    kas_id UUID;
    bank_id UUID;
    piutang_id UUID;
    persediaan_id UUID;
    aset_lancar_lain_id UUID;
    aset_tetap_id UUID;
    kewajiban_id UUID;
    hutang_id UUID;
    hutang_lancar_id UUID;
    hutang_jangka_panjang_id UUID;
    modal_id UUID;
    pendapatan_id UUID;
    pendapatan_usaha_id UUID;
    pendapatan_lain_id UUID;
    beban_id UUID;
    beban_operasional_id UUID;
    beban_lain_id UUID;
BEGIN
    -- Insert main account categories
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header)
    VALUES ('1000', 'Aset', 'Aset', true) RETURNING id INTO aset_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header)
    VALUES ('2000', 'Kewajiban', 'Kewajiban', true) RETURNING id INTO kewajiban_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header)
    VALUES ('3000', 'Modal', 'Modal', true) RETURNING id INTO modal_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header)
    VALUES ('4000', 'Pendapatan', 'Pendapatan', true) RETURNING id INTO pendapatan_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_header)
    VALUES ('5000', 'Beban', 'Beban', true) RETURNING id INTO beban_id;
    
    -- Insert Aset sub-categories
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1100', 'Kas', 'Aset', aset_id, true) RETURNING id INTO kas_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1200', 'Bank', 'Aset', aset_id, true) RETURNING id INTO bank_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1300', 'Piutang', 'Aset', aset_id, true) RETURNING id INTO piutang_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1400', 'Persediaan', 'Aset', aset_id, true) RETURNING id INTO persediaan_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1500', 'Aset Lancar Lainnya', 'Aset', aset_id, true) RETURNING id INTO aset_lancar_lain_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('1600', 'Aset Tetap', 'Aset', aset_id, true) RETURNING id INTO aset_tetap_id;
    
    -- Insert Kewajiban sub-categories
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('2100', 'Hutang', 'Kewajiban', kewajiban_id, true) RETURNING id INTO hutang_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('2200', 'Hutang Lancar Lainnya', 'Kewajiban', kewajiban_id, true) RETURNING id INTO hutang_lancar_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('2300', 'Hutang Jangka Panjang', 'Kewajiban', kewajiban_id, true) RETURNING id INTO hutang_jangka_panjang_id;
    
    -- Insert Pendapatan sub-categories
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('4100', 'Pendapatan Usaha', 'Pendapatan', pendapatan_id, true) RETURNING id INTO pendapatan_usaha_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('4200', 'Pendapatan Lain-lain', 'Pendapatan', pendapatan_id, true) RETURNING id INTO pendapatan_lain_id;
    
    -- Insert Beban sub-categories
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('5100', 'Beban Operasional', 'Beban', beban_id, true) RETURNING id INTO beban_operasional_id;
    
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, is_header)
    VALUES ('5200', 'Beban Lain-lain', 'Beban', beban_id, true) RETURNING id INTO beban_lain_id;
    
    -- Insert detailed accounts under Kas
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1101', 'Kas Kecil', 'Aset', kas_id),
    ('1102', 'Kas Besar', 'Aset', kas_id);
    
    -- Insert detailed accounts under Bank
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1201', 'Bank BCA', 'Aset', bank_id),
    ('1202', 'Bank Mandiri', 'Aset', bank_id),
    ('1203', 'Bank BNI', 'Aset', bank_id),
    ('1204', 'Bank BRI', 'Aset', bank_id);
    
    -- Insert detailed accounts under Piutang
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1301', 'Piutang Usaha', 'Aset', piutang_id),
    ('1302', 'Piutang Karyawan', 'Aset', piutang_id),
    ('1303', 'Piutang Lain-lain', 'Aset', piutang_id);
    
    -- Insert detailed accounts under Persediaan
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1401', 'Persediaan Barang Dagang', 'Aset', persediaan_id),
    ('1402', 'Persediaan Bahan Baku', 'Aset', persediaan_id),
    ('1403', 'Persediaan Barang Jadi', 'Aset', persediaan_id);
    
    -- Insert detailed accounts under Aset Lancar Lainnya
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1501', 'Biaya Dibayar Dimuka', 'Aset', aset_lancar_lain_id),
    ('1502', 'Uang Muka', 'Aset', aset_lancar_lain_id),
    ('1503', 'PPN Masukan', 'Aset', aset_lancar_lain_id);
    
    -- Insert detailed accounts under Aset Tetap
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('1601', 'Tanah', 'Aset', aset_tetap_id),
    ('1602', 'Bangunan', 'Aset', aset_tetap_id),
    ('1603', 'Kendaraan', 'Aset', aset_tetap_id),
    ('1604', 'Peralatan Kantor', 'Aset', aset_tetap_id),
    ('1605', 'Akumulasi Penyusutan', 'Aset', aset_tetap_id);
    
    -- Insert detailed accounts under Hutang
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('2101', 'Hutang Usaha', 'Kewajiban', hutang_id),
    ('2102', 'Hutang Gaji', 'Kewajiban', hutang_id),
    ('2103', 'Hutang Pajak', 'Kewajiban', hutang_id);
    
    -- Insert detailed accounts under Hutang Lancar Lainnya
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('2201', 'PPN Keluaran', 'Kewajiban', hutang_lancar_id),
    ('2202', 'Uang Muka Penjualan', 'Kewajiban', hutang_lancar_id),
    ('2203', 'Hutang Lain-lain', 'Kewajiban', hutang_lancar_id);
    
    -- Insert detailed accounts under Hutang Jangka Panjang
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('2301', 'Hutang Bank', 'Kewajiban', hutang_jangka_panjang_id),
    ('2302', 'Hutang Leasing', 'Kewajiban', hutang_jangka_panjang_id);
    
    -- Insert detailed accounts under Modal
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('3001', 'Modal Disetor', 'Modal', modal_id),
    ('3002', 'Laba Ditahan', 'Modal', modal_id),
    ('3003', 'Laba Tahun Berjalan', 'Modal', modal_id);
    
    -- Insert detailed accounts under Pendapatan Usaha
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('4101', 'Penjualan', 'Pendapatan', pendapatan_usaha_id),
    ('4102', 'Diskon Penjualan', 'Pendapatan', pendapatan_usaha_id),
    ('4103', 'Retur Penjualan', 'Pendapatan', pendapatan_usaha_id);
    
    -- Insert detailed accounts under Pendapatan Lain-lain
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('4201', 'Pendapatan Bunga', 'Pendapatan', pendapatan_lain_id),
    ('4202', 'Pendapatan Sewa', 'Pendapatan', pendapatan_lain_id),
    ('4203', 'Laba Selisih Kurs', 'Pendapatan', pendapatan_lain_id);
    
    -- Insert detailed accounts under Beban Operasional
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('5101', 'Beban Gaji', 'Beban', beban_operasional_id),
    ('5102', 'Beban Sewa', 'Beban', beban_operasional_id),
    ('5103', 'Beban Listrik & Air', 'Beban', beban_operasional_id),
    ('5104', 'Beban Telepon & Internet', 'Beban', beban_operasional_id),
    ('5105', 'Beban Perlengkapan Kantor', 'Beban', beban_operasional_id),
    ('5106', 'Beban Penyusutan', 'Beban', beban_operasional_id),
    ('5107', 'Beban Transportasi', 'Beban', beban_operasional_id),
    ('5108', 'Beban Pemasaran', 'Beban', beban_operasional_id);
    
    -- Insert detailed accounts under Beban Lain-lain
    INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
    VALUES 
    ('5201', 'Beban Bunga', 'Beban', beban_lain_id),
    ('5202', 'Beban Administrasi Bank', 'Beban', beban_lain_id),
    ('5203', 'Rugi Selisih Kurs', 'Beban', beban_lain_id),
    ('5204', 'Beban Pajak', 'Beban', beban_lain_id);
    
    -- Update all account totals after inserting
    PERFORM update_all_account_totals(NULL, NULL);
    
END;
$$ LANGUAGE plpgsql;