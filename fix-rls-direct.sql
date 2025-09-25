-- Direct SQL to fix RLS policies for trading_accounts table
-- This should be run in Supabase SQL Editor or via psql

-- 1. Enable RLS on trading_accounts table
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "authenticated_users_own_accounts" ON public.trading_accounts;

-- 3. Create proper RLS policies
CREATE POLICY "Users can view own accounts" ON public.trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON public.trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.trading_accounts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Grant necessary permissions to authenticated role
GRANT ALL ON public.trading_accounts TO authenticated;

-- 5. Revoke permissions from anon role (for security)
REVOKE ALL ON public.trading_accounts FROM anon;

-- 6. Verify the setup
SELECT 'RLS policies created successfully' as status;

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'trading_accounts';

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'trading_accounts';