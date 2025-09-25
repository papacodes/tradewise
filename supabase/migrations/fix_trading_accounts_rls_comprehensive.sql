-- Comprehensive RLS fix for trading_accounts table
-- This migration ensures proper permissions and policies for authenticated users

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_select_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_insert_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_update_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_delete_policy" ON trading_accounts;

-- Ensure RLS is enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated role
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Revoke permissions from anon role for security
REVOKE ALL PRIVILEGES ON trading_accounts FROM anon;

-- Create comprehensive RLS policies for authenticated users
CREATE POLICY "authenticated_users_select_own_accounts" ON trading_accounts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_accounts" ON trading_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_accounts" ON trading_accounts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_accounts" ON trading_accounts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Verify the policies are created
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

-- Verify permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;