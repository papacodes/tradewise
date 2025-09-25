-- Grant basic permissions to authenticated and anon roles for trading_accounts
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT SELECT ON trading_accounts TO anon;

-- Enable RLS if not already enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Create a simple RLS policy for authenticated users to access their own accounts
CREATE POLICY IF NOT EXISTS "authenticated_users_own_accounts" 
    ON trading_accounts 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

SELECT 'Permissions granted successfully' as result;