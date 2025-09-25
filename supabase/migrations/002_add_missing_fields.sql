-- Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Add missing currency field to trading_accounts table
ALTER TABLE trading_accounts 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Update existing profiles to split full_name into first_name and last_name
UPDATE profiles 
SET 
    first_name = CASE 
        WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
        THEN split_part(full_name, ' ', 1)
        ELSE full_name
    END,
    last_name = CASE 
        WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
        THEN substring(full_name from position(' ' in full_name) + 1)
        ELSE NULL
    END
WHERE full_name IS NOT NULL;

-- Grant permissions for the updated tables
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON trading_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trading_accounts TO anon;