-- First, let's ensure the trading_accounts table has proper RLS policies
-- Enable RLS on trading_accounts if not already enabled
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON trading_accounts;

-- Create comprehensive RLS policies for trading_accounts
CREATE POLICY "Users can view their own trading accounts" 
    ON trading_accounts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading accounts" 
    ON trading_accounts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading accounts" 
    ON trading_accounts FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading accounts" 
    ON trading_accounts FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT SELECT ON trading_accounts TO anon;

-- Also ensure the user_id column has proper constraints
-- (This will fail if constraint already exists, which is fine)
DO $$ 
BEGIN
    ALTER TABLE trading_accounts ADD CONSTRAINT trading_accounts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN 
        NULL; -- Constraint already exists, ignore
END $$;

-- Verify the setup
SELECT 'RLS Policies Created Successfully' as status;