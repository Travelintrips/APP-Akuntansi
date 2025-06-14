-- Enable realtime for chart_of_accounts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chart_of_accounts'
  ) THEN
    alter publication supabase_realtime add table chart_of_accounts;
  END IF;
END
$$;
