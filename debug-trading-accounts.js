import { createClient } from '@supabase/supabase-js';

// Get Supabase config
const supabaseUrl = 'https://tfwoxmtooyzvldznoveu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDg0OTEsImV4cCI6MjA3NDIyNDQ5MX0.NIXJia81vfXb-HqcN9tP_rEu8NtSs4V7d4n1ui3OYDM';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY0ODQ5MSwiZXhwIjoyMDc0MjI0NDkxfQ.eBJpZY7Ajus6gQo3jdP5odbBl58D22O1xkLPuiVaG2w';

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