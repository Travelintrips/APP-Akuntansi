-- Add standard Indonesian Chart of Accounts

-- Function to check if COA table is empty and insert standard data if it is
CREATE OR REPLACE FUNCTION insert_standard_coa()
RETURNS void AS $$
DECLARE
  coa_count INTEGER;
BEGIN
  -- Check if the table is empty
  SELECT COUNT(*) INTO coa_count FROM chart_of_accounts;
  
  -- Only insert if the table is empty
  IF coa_count = 0 THEN
    -- Aset (Assets)
    INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
    -- Aset Lancar (Current Assets)
    ('1-1000', 'Kas', 'Aset'),
    ('1-1100', 'Kas Kecil', 'Aset'),
    ('1-1200', 'Bank', 'Aset'),
    ('1-1300', 'Deposito', 'Aset'),
    ('1-1400', 'Piutang Usaha', 'Aset'),
    ('1-1500', 'Cadangan Kerugian Piutang', 'Aset'),
    ('1-1600', 'Piutang Karyawan', 'Aset'),
    ('1-1700', 'Persediaan', 'Aset'),
    ('1-1800', 'Biaya Dibayar Dimuka', 'Aset'),
    ('1-1900', 'Uang Muka', 'Aset'),
    
    -- Aset Tetap (Fixed Assets)
    ('1-2000', 'Tanah', 'Aset'),
    ('1-2100', 'Bangunan', 'Aset'),
    ('1-2200', 'Akumulasi Penyusutan Bangunan', 'Aset'),
    ('1-2300', 'Kendaraan', 'Aset'),
    ('1-2400', 'Akumulasi Penyusutan Kendaraan', 'Aset'),
    ('1-2500', 'Peralatan Kantor', 'Aset'),
    ('1-2600', 'Akumulasi Penyusutan Peralatan Kantor', 'Aset'),
    ('1-2700', 'Mesin dan Peralatan', 'Aset'),
    ('1-2800', 'Akumulasi Penyusutan Mesin dan Peralatan', 'Aset'),
    
    -- Aset Tidak Berwujud (Intangible Assets)
    ('1-3000', 'Goodwill', 'Aset'),
    ('1-3100', 'Hak Paten', 'Aset'),
    ('1-3200', 'Hak Cipta', 'Aset'),
    ('1-3300', 'Merek Dagang', 'Aset'),
    
    -- Aset Lainnya (Other Assets)
    ('1-4000', 'Investasi Jangka Panjang', 'Aset'),
    ('1-4100', 'Aset Pajak Tangguhan', 'Aset'),
    
    -- Kewajiban (Liabilities)
    -- Kewajiban Jangka Pendek (Current Liabilities)
    ('2-1000', 'Hutang Usaha', 'Kewajiban'),
    ('2-1100', 'Hutang Bank Jangka Pendek', 'Kewajiban'),
    ('2-1200', 'Hutang Pajak', 'Kewajiban'),
    ('2-1300', 'PPN Keluaran', 'Kewajiban'),
    ('2-1400', 'Hutang Gaji', 'Kewajiban'),
    ('2-1500', 'Biaya Yang Masih Harus Dibayar', 'Kewajiban'),
    ('2-1600', 'Pendapatan Diterima Dimuka', 'Kewajiban'),
    
    -- Kewajiban Jangka Panjang (Long-term Liabilities)
    ('2-2000', 'Hutang Bank Jangka Panjang', 'Kewajiban'),
    ('2-2100', 'Hutang Obligasi', 'Kewajiban'),
    ('2-2200', 'Hutang Leasing', 'Kewajiban'),
    
    -- Modal (Equity)
    ('3-1000', 'Modal Disetor', 'Modal'),
    ('3-1100', 'Tambahan Modal Disetor', 'Modal'),
    ('3-1200', 'Laba Ditahan', 'Modal'),
    ('3-1300', 'Laba Tahun Berjalan', 'Modal'),
    
    -- Pendapatan (Revenue)
    ('4-1000', 'Pendapatan Penjualan', 'Pendapatan'),
    ('4-1100', 'Pendapatan Jasa', 'Pendapatan'),
    ('4-1200', 'Diskon Penjualan', 'Pendapatan'),
    ('4-1300', 'Retur Penjualan', 'Pendapatan'),
    ('4-2000', 'Pendapatan Lain-lain', 'Pendapatan'),
    ('4-2100', 'Pendapatan Bunga', 'Pendapatan'),
    ('4-2200', 'Pendapatan Sewa', 'Pendapatan'),
    
    -- Beban (Expenses)
    -- Beban Operasional (Operating Expenses)
    ('5-1000', 'Beban Pokok Penjualan', 'Beban'),
    ('5-1100', 'Beban Gaji', 'Beban'),
    ('5-1200', 'Beban Sewa', 'Beban'),
    ('5-1300', 'Beban Listrik dan Air', 'Beban'),
    ('5-1400', 'Beban Telepon dan Internet', 'Beban'),
    ('5-1500', 'Beban Perlengkapan Kantor', 'Beban'),
    ('5-1600', 'Beban Penyusutan Bangunan', 'Beban'),
    ('5-1700', 'Beban Penyusutan Kendaraan', 'Beban'),
    ('5-1800', 'Beban Penyusutan Peralatan Kantor', 'Beban'),
    ('5-1900', 'Beban Penyusutan Mesin dan Peralatan', 'Beban'),
    ('5-2000', 'Beban Pemeliharaan', 'Beban'),
    ('5-2100', 'Beban Asuransi', 'Beban'),
    ('5-2200', 'Beban Iklan dan Promosi', 'Beban'),
    ('5-2300', 'Beban Perjalanan Dinas', 'Beban'),
    ('5-2400', 'Beban Transportasi', 'Beban'),
    
    -- Beban Non-Operasional (Non-Operating Expenses)
    ('5-3000', 'Beban Bunga', 'Beban'),
    ('5-3100', 'Beban Administrasi Bank', 'Beban'),
    ('5-3200', 'Beban Pajak', 'Beban'),
    ('5-3300', 'Beban Lain-lain', 'Beban');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to insert data if table is empty
SELECT insert_standard_coa();
