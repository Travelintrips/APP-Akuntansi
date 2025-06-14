-- Add is_header and parent_account_id columns to chart_of_accounts table
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_header BOOLEAN DEFAULT FALSE;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES chart_of_accounts(id) NULL;

-- Update existing accounts to be header accounts
UPDATE chart_of_accounts SET is_header = TRUE;
