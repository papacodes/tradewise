-- Fix RLS policies and permissions for trading_accounts table

-- First, ensure RLS is enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete own trading accounts" ON trading_accounts;

-- Create new RLS policies
CREATE POLICY "Users can view own trading accounts" ON trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading accounts" ON trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading accounts" ON trading_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading accounts" ON trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON trading_accounts TO authenticated;

-- Revoke permissions from anon role (for security)
REVOKE ALL ON trading_accounts FROM anon;

-- Verify the setup
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'trading_accounts';

SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;