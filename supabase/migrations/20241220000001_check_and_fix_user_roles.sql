-- Check existing users and their roles
SELECT id, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- Update specific user role if needed (melsa1@gmail.com)
UPDATE users 
SET role = 'staff_trips' 
WHERE email = 'melsa1@gmail.com';

-- Insert missing users from auth.users if they don't exist in public.users
INSERT INTO users (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    'staff_trips' as role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
AND au.email IS NOT NULL;

-- Ensure staff@trips.com has staff_trips role
INSERT INTO users (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    'Staff Trips User' as full_name,
    'staff_trips' as role
FROM auth.users au
WHERE au.email = 'staff@trips.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff@trips.com')
ON CONFLICT (id) DO UPDATE SET
    role = 'staff_trips',
    full_name = COALESCE(users.full_name, 'Staff Trips User');

-- Ensure melsa1@gmail.com has staff_trips role
INSERT INTO users (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Melsa User') as full_name,
    'staff_trips' as role
FROM auth.users au
WHERE au.email = 'melsa1@gmail.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'melsa1@gmail.com')
ON CONFLICT (id) DO UPDATE SET
    role = 'staff_trips',
    full_name = COALESCE(users.full_name, 'Melsa User');

-- Show final results
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE email IN ('staff@trips.com', 'melsa1@gmail.com', 'admin@contoh.com')
ORDER BY email;