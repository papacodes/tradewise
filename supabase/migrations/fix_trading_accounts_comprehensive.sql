-- Comprehensive fix for trading_accounts RLS and permissions
-- This migration will completely reset and properly configure RLS

-- First, disable RLS temporarily to clean up
ALTER TABLE trading_accounts DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_select_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_insert_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_update_policy" ON trading_accounts;
DROP POLICY IF EXISTS "trading_accounts_delete_policy" ON trading_accounts;

-- Revoke all permissions first
REVOKE ALL ON trading_accounts FROM anon;
REVOKE ALL ON trading_accounts FROM authenticated;
REVOKE ALL ON trading_accounts FROM public;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON trading_accounts TO authenticated;

-- Re-enable RLS
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- SELECT policy: Users can only view their own trading accounts
CREATE POLICY "trading_accounts_select_policy" ON trading_accounts
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- INSERT policy: Users can only create trading accounts for themselves
CREATE POLICY "trading_accounts_insert_policy" ON trading_accounts
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own trading accounts
CREATE POLICY "trading_accounts_update_policy" ON trading_accounts
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can only delete their own trading accounts
CREATE POLICY "trading_accounts_delete_policy" ON trading_accounts
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- Verify the setup with detailed output
DO $$
DECLARE
    policy_record RECORD;
    permission_record RECORD;
    table_record RECORD;
BEGIN
    RAISE NOTICE '=== TRADING ACCOUNTS RLS VERIFICATION ===';
    
    -- Check RLS status
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'trading_accounts' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Table: %.% | RLS Enabled: %', 
            table_record.schemaname,
            table_record.tablename, 
            table_record.rowsecurity;
    END LOOP;
    
    -- Check policies
    RAISE NOTICE 'RLS Policies:';
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'trading_accounts' AND schemaname = 'public'
        ORDER BY cmd, policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: % | Using: % | Check: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles, 
            COALESCE(policy_record.qual, 'N/A'),
            COALESCE(policy_record.with_check, 'N/A');
    END LOOP;
    
    -- Check permissions
    RAISE NOTICE 'Table Permissions:';
    FOR permission_record IN 
        SELECT grantee, table_name, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_schema = 'public' 
            AND table_name = 'trading_accounts' 
            AND grantee IN ('anon', 'authenticated', 'public')
        ORDER BY grantee, privilege_type
    LOOP
        RAISE NOTICE 'Role: % | Privilege: %', 
            permission_record.grantee, 
            permission_record.privilege_type;
    END LOOP;
    
    RAISE NOTICE '=== END VERIFICATION ===';
END $$;