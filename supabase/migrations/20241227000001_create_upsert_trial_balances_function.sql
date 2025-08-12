-- Create upsert_trial_balances function
CREATE OR REPLACE FUNCTION upsert_trial_balances(
  p_account_code TEXT,
  p_period TEXT,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update trial balance record
  INSERT INTO trial_balance (account_code, period, amount, updated_at)
  VALUES (p_account_code, p_period, p_amount, NOW())
  ON CONFLICT (account_code, period)
  DO UPDATE SET
    amount = EXCLUDED.amount,
    updated_at = NOW();
END;
$$;
