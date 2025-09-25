-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trading_accounts table
CREATE TABLE trading_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    starting_balance DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create confluence_options table
CREATE TABLE confluence_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mistake_options table
CREATE TABLE mistake_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE NOT NULL,
    trade_name TEXT NOT NULL,
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    symbol TEXT NOT NULL,
    news_impact TEXT,
    market_bias TEXT NOT NULL,
    trading_session TEXT NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_price DECIMAL(15,8) NOT NULL,
    stop_loss_price DECIMAL(15,8) NOT NULL,
    take_profit_price DECIMAL(15,8) NOT NULL,
    is_profitable BOOLEAN NOT NULL,
    pnl_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trade_confluences junction table
CREATE TABLE trade_confluences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
    confluence_id UUID REFERENCES confluence_options(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trade_id, confluence_id)
);

-- Create trade_mistakes junction table
CREATE TABLE trade_mistakes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
    mistake_id UUID REFERENCES mistake_options(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trade_id, mistake_id)
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_accounts_updated_at
    BEFORE UPDATE ON trading_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_confluences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_mistakes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for trading_accounts
CREATE POLICY "Users can view own trading accounts" ON trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading accounts" ON trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading accounts" ON trading_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading accounts" ON trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trades
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trade_confluences
CREATE POLICY "Users can view own trade confluences" ON trade_confluences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_confluences.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own trade confluences" ON trade_confluences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_confluences.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own trade confluences" ON trade_confluences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_confluences.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own trade confluences" ON trade_confluences
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_confluences.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

-- Create RLS policies for trade_mistakes
CREATE POLICY "Users can view own trade mistakes" ON trade_mistakes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_mistakes.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own trade mistakes" ON trade_mistakes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_mistakes.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own trade mistakes" ON trade_mistakes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_mistakes.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own trade mistakes" ON trade_mistakes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_mistakes.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_trading_session ON trades(trading_session);
CREATE INDEX idx_trade_confluences_trade_id ON trade_confluences(trade_id);
CREATE INDEX idx_trade_confluences_confluence_id ON trade_confluences(confluence_id);
CREATE INDEX idx_trade_mistakes_trade_id ON trade_mistakes(trade_id);
CREATE INDEX idx_trade_mistakes_mistake_id ON trade_mistakes(mistake_id);

-- Insert default confluence options
INSERT INTO confluence_options (name) VALUES
    ('Support/Resistance Level'),
    ('Trend Line Break'),
    ('Moving Average Confluence'),
    ('Fibonacci Retracement'),
    ('Chart Pattern'),
    ('Volume Confirmation'),
    ('RSI Divergence'),
    ('MACD Signal'),
    ('Bollinger Bands'),
    ('News Event');

-- Insert default mistake options
INSERT INTO mistake_options (name) VALUES
    ('Entered Too Early'),
    ('Entered Too Late'),
    ('Wrong Position Size'),
    ('Moved Stop Loss'),
    ('Took Profit Too Early'),
    ('Ignored Risk Management'),
    ('Emotional Trading'),
    ('Overtrading'),
    ('Revenge Trading'),
    ('FOMO (Fear of Missing Out)');