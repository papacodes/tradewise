-- Final fix for trading_accounts permissions
-- This ensures authenticated users can access their data through the anon key

-- First, ensure RLS is enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete own trading accounts" ON trading_accounts;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own trading accounts" ON trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading accounts" ON trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading accounts" ON trading_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading accounts" ON trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
-- The anon role needs SELECT permission to execute queries (RLS will filter the results)
GRANT SELECT ON trading_accounts TO anon;
GRANT INSERT, UPDATE, DELETE ON trading_accounts TO anon;

-- Grant full permissions to authenticated role
GRANT ALL ON trading_accounts TO authenticated;

-- Verify the setup
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
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