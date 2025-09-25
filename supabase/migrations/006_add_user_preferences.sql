-- Add user preferences fields to profiles table
ALTER TABLE profiles 
ADD COLUMN bio TEXT,
ADD COLUMN location TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN website TEXT,
ADD COLUMN theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN language TEXT DEFAULT 'en',
ADD COLUMN timezone TEXT DEFAULT 'UTC',
ADD COLUMN email_notifications BOOLEAN DEFAULT true,
ADD COLUMN push_notifications BOOLEAN DEFAULT true,
ADD COLUMN trade_notifications BOOLEAN DEFAULT true,
ADD COLUMN marketing_notifications BOOLEAN DEFAULT false,
ADD COLUMN default_position_size DECIMAL(10,4) DEFAULT 0.01,
ADD COLUMN risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Create user_sessions table for session management
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL,
    device_info TEXT,
    ip_address INET,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO anon;

-- Create trigger for user_sessions updated_at
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update last_login_at when user signs in
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET last_login_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_login_at
CREATE TRIGGER update_last_login_trigger
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();