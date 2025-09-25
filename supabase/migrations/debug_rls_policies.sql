-- Debug RLS policies and permissions for trading_accounts table

-- 1. Check if RLS is enabled on trading_accounts
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'trading_accounts';

-- 2. Check existing RLS policies on trading_accounts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'trading_accounts'
ORDER BY policyname;

-- 3. Check table permissions for anon and authenticated roles
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts'
    AND grantee IN ('anon', 'authenticated', 'postgres')
ORDER BY grantee, privilege_type;

-- 4. Check if there's any data in trading_accounts (as superuser)
SELECT 
    COUNT(*) as total_accounts,
    COUNT(DISTINCT user_id) as unique_users
FROM trading_accounts;

-- 5. Show sample data (first 3 records)
SELECT 
    id,
    user_id,
    name,
    starting_balance,
    current_balance,
    created_at
FROM trading_accounts 
ORDER BY created_at DESC 
LIMIT 3;

-- 6. Check auth.users table to see if there are any users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

-- 7. Show relationship between users and accounts
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    COUNT(ta.id) as account_count
FROM auth.users u
LEFT JOIN trading_accounts ta ON u.id = ta.user_id
GROUP BY u.id, u.email, u.email_confirmed_at
ORDER BY account_count DESC
LIMIT 5;