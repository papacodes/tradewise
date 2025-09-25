-- Consolidate profiles table schema to fix duplicate fields and conflicts
-- This migration creates a clean, unified profiles table structure

-- First, create a backup of existing data
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;

-- Drop the existing profiles table to start fresh
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the consolidated profiles table with all required fields
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    phone TEXT,
    website TEXT,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    trade_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    default_position_size DECIMAL(10,4) DEFAULT 0.01 CHECK (default_position_size > 0),
    risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Restore data from backup, handling field mapping
INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    bio,
    location,
    phone,
    website,
    theme,
    currency,
    language,
    timezone,
    email_notifications,
    push_notifications,
    trade_notifications,
    marketing_notifications,
    default_position_size,
    risk_tolerance,
    two_factor_enabled,
    last_login_at,
    subscription_tier,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    trial_end_date,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)) as first_name,
    COALESCE(last_name, CASE 
        WHEN full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0 
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE NULL 
    END) as last_name,
    avatar_url,
    bio,
    location,
    phone,
    website,
    COALESCE(theme, 'dark'),
    COALESCE(currency, 'USD'),
    COALESCE(language, 'en'),
    COALESCE(timezone, 'UTC'),
    COALESCE(email_notifications, true),
    COALESCE(push_notifications, true),
    COALESCE(trade_notifications, true),
    COALESCE(marketing_notifications, false),
    COALESCE(default_position_size, 0.01),
    COALESCE(risk_tolerance, 'medium'),
    COALESCE(two_factor_enabled, false),
    last_login_at,
    COALESCE(subscription_tier, 'free'),
    COALESCE(subscription_status, 'active'),
    subscription_start_date,
    subscription_end_date,
    trial_end_date,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
FROM profiles_backup;

-- Drop the backup table
DROP TABLE profiles_backup;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Drop existing functions first to avoid parameter conflicts
DROP FUNCTION IF EXISTS get_account_limit(UUID);
DROP FUNCTION IF EXISTS can_create_account(UUID);

-- Recreate the get_account_limit function
CREATE FUNCTION get_account_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    tier TEXT;
BEGIN
    SELECT subscription_tier INTO tier
    FROM profiles
    WHERE id = user_id;
    
    CASE tier
        WHEN 'free' THEN RETURN 1;
        WHEN 'pro' THEN RETURN 5;
        WHEN 'premium' THEN RETURN -1; -- unlimited
        ELSE RETURN 1;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the can_create_account function
CREATE FUNCTION can_create_account(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    account_limit INTEGER;
    current_count INTEGER;
BEGIN
    SELECT get_account_limit(user_id) INTO account_limit;
    
    IF account_limit = -1 THEN
        RETURN TRUE; -- unlimited
    END IF;
    
    SELECT COUNT(*) INTO current_count
    FROM accounts
    WHERE user_id = user_id;
    
    RETURN current_count < account_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_account_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_create_account(UUID) TO anon, authenticated;

-- Update existing users to have trial end date if they don't have one
UPDATE profiles 
SET trial_end_date = created_at + INTERVAL '14 days'
WHERE subscription_tier = 'free' 
AND trial_end_date IS NULL;

COMMIT;