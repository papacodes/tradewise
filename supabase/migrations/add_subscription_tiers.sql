-- Add subscription tier fields to profiles table
ALTER TABLE profiles 
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
ADD COLUMN subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN subscription_end_date TIMESTAMPTZ,
ADD COLUMN trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;

-- Create index for faster subscription queries
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Update existing users to have free tier with trial period
UPDATE profiles 
SET 
  subscription_tier = 'free',
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '14 days'
WHERE subscription_tier IS NULL;

-- Create function to check account limits based on subscription tier
CREATE OR REPLACE FUNCTION get_account_limit(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE tier
    WHEN 'free' THEN RETURN 2;
    WHEN 'pro' THEN RETURN 10;
    WHEN 'enterprise' THEN RETURN -1; -- unlimited
    ELSE RETURN 1;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can create more accounts
CREATE OR REPLACE FUNCTION can_create_account(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  account_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = user_uuid;
  
  -- Get account limit for tier
  SELECT get_account_limit(user_tier) INTO account_limit;
  
  -- If unlimited accounts (enterprise)
  IF account_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Count current accounts
  SELECT COUNT(*) INTO current_count
  FROM trading_accounts
  WHERE user_id = user_uuid;
  
  -- Check if under limit
  RETURN current_count < account_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_account_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_account(UUID) TO authenticated;