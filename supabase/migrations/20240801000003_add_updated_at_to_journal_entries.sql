-- Add updated_at column to journal_entries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journal_entries' AND column_name = 'updated_at') THEN
        ALTER TABLE journal_entries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END$$;

-- Create or replace a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_journal_entries_updated_at ON journal_entries;

-- Create the trigger
CREATE TRIGGER set_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
