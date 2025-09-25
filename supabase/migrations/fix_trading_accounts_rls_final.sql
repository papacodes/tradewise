-- Fix RLS policies for trading_accounts table
-- This migration ensures proper security for the trading_accounts table

-- Enable RLS on trading_accounts table
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON trading_accounts;

-- Create new RLS policies
-- SELECT policy: Users can only view their own trading accounts
CREATE POLICY "Users can view their own trading accounts" ON trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT policy: Users can only create trading accounts for themselves
CREATE POLICY "Users can insert their own trading accounts" ON trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own trading accounts
CREATE POLICY "Users can update their own trading accounts" ON trading_accounts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own trading accounts
CREATE POLICY "Users can delete their own trading accounts" ON trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant proper permissions
-- Remove all permissions from anon role for security
REVOKE ALL ON trading_accounts FROM anon;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON trading_accounts TO authenticated;

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE tablename = 'trading_accounts' AND schemaname = 'public';

-- Show current policies
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
WHERE tablename = 'trading_accounts' AND schemaname = 'public';

-- Show current permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;