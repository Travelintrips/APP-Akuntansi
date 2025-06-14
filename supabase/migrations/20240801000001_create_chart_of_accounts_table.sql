-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code VARCHAR(20) NOT NULL UNIQUE,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_header BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  current_balance DECIMAL(18, 2) DEFAULT 0,
  total_debit DECIMAL(18, 2) DEFAULT 0,
  total_credit DECIMAL(18, 2) DEFAULT 0,
  balance_total DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row-level security
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Public access" ON chart_of_accounts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert" ON chart_of_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can update" ON chart_of_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can delete" ON chart_of_accounts FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chart_of_accounts;
