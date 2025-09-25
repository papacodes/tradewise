import { createClient } from '@supabase/supabase-js';

// Get Supabase config
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Please check your .env file for: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function debugTradingAccounts() {
  console.log('🔍 Debugging trading_accounts access...');
  
  try {
    // Test 1: Check if we can query without authentication (should fail)
    console.log('\n1. Testing anonymous access...');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('trading_accounts')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✅ Anonymous access failed (expected):', anonError.message);
    } else {
      console.log('⚠️ Anonymous access succeeded (potential security issue):', anonData);
    }
    
    // Test 2: Check with service role (should work)
    console.log('\n2. Testing service role access...');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('trading_accounts')
      .select('*')
      .limit(5);
    
    if (serviceError) {
      console.log('❌ Service role access failed:', serviceError.message);
    } else {
      console.log('✅ Service role access succeeded. Found', serviceData.length, 'accounts');
      console.log('Sample data:', serviceData);
    }
    
    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabaseService
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'trading_accounts';`
      });
    
    if (policyError) {
      console.log('❌ Could not check policies:', policyError.message);
    } else {
      console.log('✅ Current RLS policies:', policies);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugTradingAccounts();