-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code VARCHAR NOT NULL UNIQUE,
  account_name VARCHAR NOT NULL,
  account_type VARCHAR NOT NULL CHECK (account_type IN ('Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can perform all operations" ON chart_of_accounts;
CREATE POLICY "Authenticated users can perform all operations"
  ON chart_of_accounts
  USING (auth.role() = 'authenticated');

-- Enable realtime
-- Table is already a member of supabase_realtime publication