-- Add dokumen field to users table for storing document URLs
ALTER TABLE users ADD COLUMN IF NOT EXISTS dokumen TEXT;

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;
