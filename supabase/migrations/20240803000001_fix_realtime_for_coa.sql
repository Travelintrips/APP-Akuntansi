-- First, check if the table is already in the publication and remove it if it exists
-- We can't use DROP TABLE IF EXISTS directly with ALTER PUBLICATION
-- Instead, we'll use a DO block with dynamic SQL
DO $$
BEGIN
  -- Check if the table is in the publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chart_of_accounts'
  ) THEN
    -- Remove it from the publication
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.chart_of_accounts';
  END IF;
END
$$;

-- Now add the table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;

-- Create or replace the trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop both possible triggers if they exist
DROP TRIGGER IF EXISTS set_chart_of_accounts_updated_at ON public.chart_of_accounts;
DROP TRIGGER IF EXISTS update_chart_of_accounts ON public.chart_of_accounts;

-- Create the trigger (using DO block to check if it exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chart_of_accounts' 
    AND tgrelid = 'public.chart_of_accounts'::regclass
  ) THEN
    CREATE TRIGGER update_chart_of_accounts
    BEFORE UPDATE ON public.chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;