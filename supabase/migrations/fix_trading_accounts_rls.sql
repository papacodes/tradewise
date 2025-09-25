-- Fix RLS policies and permissions for trading_accounts table

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON trading_accounts;

-- Grant necessary permissions to authenticated users
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own trading accounts"
  ON trading_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading accounts"
  ON trading_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading accounts"
  ON trading_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading accounts"
  ON trading_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role for any public access (if needed)
GRANT SELECT ON trading_accounts TO anon;

-- Verify permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'trading_accounts'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;