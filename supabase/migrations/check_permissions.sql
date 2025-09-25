-- Check permissions and RLS policies for trading_accounts

-- 1. Check table permissions for anon and authenticated roles
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

-- 3. Check if there are any users and accounts
SELECT 
    'Users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Trading Accounts' as table_name,
    COUNT(*) as count
FROM trading_accounts;

-- 4. Show sample data with user info
SELECT 
    ta.id,
    ta.user_id,
    u.email,
    ta.name,
    ta.starting_balance,
    ta.current_balance,
    ta.created_at
FROM trading_accounts ta
LEFT JOIN auth.users u ON ta.user_id = u.id
ORDER BY ta.created_at DESC 
LIMIT 5;