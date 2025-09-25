// Test script to check Supabase access to trading_accounts table
import { createClient } from '@supabase/supabase-js';

// Get Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
// Create regular client with anon key
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testTableAccess() {
  try {
    console.log('Testing trading_accounts table access...');
    
    // Test 1: Check if table exists with admin access
    console.log('\n1. Admin access test:');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('trading_accounts')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.error('Admin access error:', adminError);
    } else {
      console.log('✓ Admin can access table');
      console.log('Sample data:', adminData);
    }
    
    // Test 2: Check anon access (should fail due to RLS)
    console.log('\n2. Anonymous access test:');
    const { data: anonData, error: anonError } = await supabaseClient
      .from('trading_accounts')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✓ Anonymous access properly blocked:', anonError.message);
    } else {
      console.log('⚠️ Anonymous access allowed (potential security issue)');
    }
    
    // Test 3: Try to fix RLS policies using admin client
    console.log('\n3. Attempting to fix RLS policies...');
    
    // Enable RLS
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;'
    }).catch(() => ({ error: { message: 'RPC not available, using direct approach' } }));
    
    if (rlsError && !rlsError.message.includes('RPC not available')) {
      console.log('RLS enable result:', rlsError.message);
    }
    
    // Grant permissions
    console.log('\n4. Checking current permissions...');
    const { data: currentPerms, error: permError } = await supabaseAdmin
      .from('information_schema.role_table_grants')
      .select('grantee, privilege_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'trading_accounts')
      .in('grantee', ['anon', 'authenticated']);
    
    if (permError) {
      console.log('Could not check permissions:', permError.message);
    } else {
      console.log('Current permissions:', currentPerms);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTableAccess();