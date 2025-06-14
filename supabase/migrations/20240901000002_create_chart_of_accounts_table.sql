-- Create chart_of_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(20) NOT NULL UNIQUE,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  is_header BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  description TEXT,
  normal_balance VARCHAR(10) NOT NULL,
  current_balance DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  debit_total DECIMAL(18, 2) DEFAULT 0,
  credit_total DECIMAL(18, 2) DEFAULT 0
);

-- Enable realtime for chart_of_accounts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
