-- Debug query to check trading accounts data
SELECT 
  id,
  user_id,
  name,
  starting_balance,
  current_balance,
  currency,
  created_at
FROM trading_accounts
ORDER BY created_at DESC;

-- Check permissions for trading_accounts table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'trading_accounts'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Check RLS policies for trading_accounts
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
WHERE tablename = 'trading_accounts';