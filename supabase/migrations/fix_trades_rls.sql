-- Fix RLS policies for trades table

-- 1. Grant necessary permissions to authenticated role
GRANT ALL PRIVILEGES ON trades TO authenticated;
GRANT SELECT ON trades TO anon;

-- 2. Create RLS policy for authenticated users to access their own trades
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Create RLS policy for authenticated users to insert their own trades
CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create RLS policy for authenticated users to update their own trades
CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create RLS policy for authenticated users to delete their own trades
CREATE POLICY "Users can delete their own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Verify the policies were created for trades
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'trades'
ORDER BY policyname;

-- 7. Also check trading_accounts policies
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