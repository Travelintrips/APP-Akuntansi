-- Fix staff trips user access to transaction reports

-- First, ensure all auth users exist in public.users table
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    'staff_trips' as role,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.email IS NOT NULL;

-- Update specific staff trips users if they exist
UPDATE public.users 
SET role = 'staff_trips' 
WHERE email IN ('staff@trips.com', 'melsa1@gmail.com')
AND role != 'admin';

-- Ensure admin user exists and has correct role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@contoh.com';

-- Add any missing admin user
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User') as full_name,
    'admin' as role,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admin@contoh.com'
AND pu.id IS NULL;

-- Enable realtime for users table
alter publication supabase_realtime add table users;