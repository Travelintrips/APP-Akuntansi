-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Create enum for user roles
DO $ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff_trips');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Drop any existing policies that depend on the role column
DROP POLICY IF EXISTS "Allow insert by admin" ON api_settings;
DROP POLICY IF EXISTS "Allow update by admin" ON api_settings;
DROP POLICY IF EXISTS "Allow delete by admin" ON api_settings;

-- Update the role column to use the enum
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';

-- Recreate policies if api_settings table exists
DO $ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_settings') THEN
        CREATE POLICY "Allow insert by admin" ON api_settings
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
        
        CREATE POLICY "Allow update by admin" ON api_settings
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
        
        CREATE POLICY "Allow delete by admin" ON api_settings
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = 'admin'
                )
            );
    END IF;
END $;

-- Insert a test staff trips user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'staff@trips.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Staff Trips"}'
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding user in public.users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'Staff Trips',
  'staff_trips'::user_role,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'staff@trips.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'staff_trips'::user_role,
  full_name = 'Staff Trips';

-- Update existing admin user
UPDATE public.users 
SET role = 'admin'::user_role 
WHERE email = 'admin@contoh.com';

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;
