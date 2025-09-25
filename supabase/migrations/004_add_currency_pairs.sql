-- Create currency_pairs table
CREATE TABLE currency_pairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('forex', 'stocks', 'crypto', 'commodities')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient searching
CREATE INDEX idx_currency_pairs_symbol ON currency_pairs(symbol);
CREATE INDEX idx_currency_pairs_category ON currency_pairs(category);
CREATE INDEX idx_currency_pairs_active ON currency_pairs(is_active);
CREATE INDEX idx_currency_pairs_symbol_search ON currency_pairs USING gin(to_tsvector('english', symbol || ' ' || name));

-- Add updated_at trigger
CREATE TRIGGER update_currency_pairs_updated_at
    BEFORE UPDATE ON currency_pairs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert popular currency pairs
INSERT INTO currency_pairs (symbol, name, category) VALUES
-- Major Forex Pairs
('EURUSD', 'Euro / US Dollar', 'forex'),
('GBPUSD', 'British Pound / US Dollar', 'forex'),
('USDJPY', 'US Dollar / Japanese Yen', 'forex'),
('USDCHF', 'US Dollar / Swiss Franc', 'forex'),
('AUDUSD', 'Australian Dollar / US Dollar', 'forex'),
('USDCAD', 'US Dollar / Canadian Dollar', 'forex'),
('NZDUSD', 'New Zealand Dollar / US Dollar', 'forex'),

-- Minor Forex Pairs
('EURGBP', 'Euro / British Pound', 'forex'),
('EURJPY', 'Euro / Japanese Yen', 'forex'),
('GBPJPY', 'British Pound / Japanese Yen', 'forex'),
('EURCHF', 'Euro / Swiss Franc', 'forex'),
('EURAUD', 'Euro / Australian Dollar', 'forex'),
('EURCAD', 'Euro / Canadian Dollar', 'forex'),
('GBPCHF', 'British Pound / Swiss Franc', 'forex'),
('GBPAUD', 'British Pound / Australian Dollar', 'forex'),
('AUDCAD', 'Australian Dollar / Canadian Dollar', 'forex'),
('AUDJPY', 'Australian Dollar / Japanese Yen', 'forex'),
('CADJPY', 'Canadian Dollar / Japanese Yen', 'forex'),
('CHFJPY', 'Swiss Franc / Japanese Yen', 'forex'),
('NZDJPY', 'New Zealand Dollar / Japanese Yen', 'forex'),

-- Popular Stocks
('AAPL', 'Apple Inc.', 'stocks'),
('MSFT', 'Microsoft Corporation', 'stocks'),
('GOOGL', 'Alphabet Inc.', 'stocks'),
('AMZN', 'Amazon.com Inc.', 'stocks'),
('TSLA', 'Tesla Inc.', 'stocks'),
('META', 'Meta Platforms Inc.', 'stocks'),
('NVDA', 'NVIDIA Corporation', 'stocks'),
('NFLX', 'Netflix Inc.', 'stocks'),
('AMD', 'Advanced Micro Devices', 'stocks'),
('BABA', 'Alibaba Group', 'stocks'),
('SPY', 'SPDR S&P 500 ETF', 'stocks'),
('QQQ', 'Invesco QQQ Trust', 'stocks'),

-- Major Cryptocurrencies
('BTCUSD', 'Bitcoin / US Dollar', 'crypto'),
('ETHUSD', 'Ethereum / US Dollar', 'crypto'),
('ADAUSD', 'Cardano / US Dollar', 'crypto'),
('SOLUSD', 'Solana / US Dollar', 'crypto'),
('DOTUSD', 'Polkadot / US Dollar', 'crypto'),
('LINKUSD', 'Chainlink / US Dollar', 'crypto'),
('MATICUSD', 'Polygon / US Dollar', 'crypto'),
('AVAXUSD', 'Avalanche / US Dollar', 'crypto'),
('UNIUSD', 'Uniswap / US Dollar', 'crypto'),
('LTCUSD', 'Litecoin / US Dollar', 'crypto'),
('BCHUSD', 'Bitcoin Cash / US Dollar', 'crypto'),
('XRPUSD', 'Ripple / US Dollar', 'crypto'),

-- Commodities
('XAUUSD', 'Gold / US Dollar', 'commodities'),
('XAGUSD', 'Silver / US Dollar', 'commodities'),
('WTIUSD', 'Crude Oil WTI / US Dollar', 'commodities'),
('XBRUSD', 'Brent Oil / US Dollar', 'commodities'),
('NATGAS', 'Natural Gas', 'commodities'),
('COPPER', 'Copper', 'commodities'),
('PLATINUM', 'Platinum', 'commodities'),
('PALLADIUM', 'Palladium', 'commodities');

-- Enable Row Level Security
ALTER TABLE currency_pairs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Currency pairs are viewable by everyone" ON currency_pairs
    FOR SELECT USING (true);

CREATE POLICY "Currency pairs can be inserted by authenticated users" ON currency_pairs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Currency pairs can be updated by authenticated users" ON currency_pairs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON currency_pairs TO anon;
GRANT ALL PRIVILEGES ON currency_pairs TO authenticated;