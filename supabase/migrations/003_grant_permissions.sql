-- Grant permissions to anon role for public access (read-only for reference tables)
GRANT SELECT ON confluence_options TO anon;
GRANT SELECT ON mistake_options TO anon;

-- Grant permissions to authenticated role for all user-related operations
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON trading_accounts TO authenticated;
GRANT ALL PRIVILEGES ON trades TO authenticated;
GRANT SELECT ON confluence_options TO authenticated;
GRANT SELECT ON mistake_options TO authenticated;

-- Grant usage on sequences (if any exist)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow read access to confluence options" ON confluence_options;
DROP POLICY IF EXISTS "Allow read access to mistake options" ON mistake_options;
DROP POLICY IF EXISTS "Allow anon read access to confluence options" ON confluence_options;
DROP POLICY IF EXISTS "Allow anon read access to mistake options" ON mistake_options;

-- Create RLS policies for confluence_options and mistake_options
-- These should be readable by all authenticated users
CREATE POLICY "Allow read access to confluence options" ON confluence_options
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to mistake options" ON mistake_options
    FOR SELECT TO authenticated USING (true);

-- Allow anon users to read reference data
CREATE POLICY "Allow anon read access to confluence options" ON confluence_options
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon read access to mistake options" ON mistake_options
     FOR SELECT TO anon USING (true);