-- Fix RLS policies for trading_accounts table

-- 1. Grant necessary permissions to authenticated role
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT SELECT ON trading_accounts TO anon;

-- 2. Create RLS policy for authenticated users to access their own accounts
CREATE POLICY "Users can view their own trading accounts" ON trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Create RLS policy for authenticated users to insert their own accounts
CREATE POLICY "Users can insert their own trading accounts" ON trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create RLS policy for authenticated users to update their own accounts
CREATE POLICY "Users can update their own trading accounts" ON trading_accounts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create RLS policy for authenticated users to delete their own accounts
CREATE POLICY "Users can delete their own trading accounts" ON trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'trading_accounts'
ORDER BY policyname;