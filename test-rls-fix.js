const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.argv[2];
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.argv[3];
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[4];

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('❌ Missing required arguments');
  console.log('Usage: node test-rls-fix.js <SUPABASE_URL> <ANON_KEY> <SERVICE_ROLE_KEY>');
  process.exit(1);
}

async function testRLSFix() {
  console.log('🔒 Testing RLS policies for trading_accounts table...');
  
  // Test 1: Anonymous access should be denied
  console.log('\n1. Testing anonymous access (should be denied):');
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  
  try {
    const { data, error } = await supabaseAnon
      .from('trading_accounts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('✅ Anonymous access properly denied:', error.message);
    } else {
      console.log('❌ Security issue: Anonymous access allowed, returned:', data?.length || 0, 'records');
    }
  } catch (err) {
    console.log('✅ Anonymous access properly denied with exception:', err.message);
  }
  
  // Test 2: Service role should have access (for admin operations)
  console.log('\n2. Testing service role access (should work):');
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('trading_accounts')
      .select('id, name, user_id')
      .limit(3);
    
    if (error) {
      console.log('❌ Service role access failed:', error.message);
    } else {
      console.log('✅ Service role access works, found', data?.length || 0, 'accounts');
      if (data && data.length > 0) {
        console.log('   Sample account:', {
          id: data[0].id,
          name: data[0].name,
          user_id: data[0].user_id?.substring(0, 8) + '...'
        });
      }
    }
  } catch (err) {
    console.log('❌ Service role access failed with exception:', err.message);
  }
  
  // Test 3: Check RLS policies are in place
  console.log('\n3. Checking RLS policies:');
  try {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'trading_accounts')
      .eq('schemaname', 'public');
    
    if (error) {
      console.log('❌ Could not check policies:', error.message);
    } else {
      console.log('✅ Found', policies?.length || 0, 'RLS policies:');
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) for roles: ${policy.roles}`);
      });
    }
  } catch (err) {
    console.log('❌ Could not check policies:', err.message);
  }
  
  // Test 4: Check table permissions
  console.log('\n4. Checking table permissions:');
  try {
    const { data: permissions, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT grantee, privilege_type
        FROM information_schema.role_table_grants 
        WHERE table_schema = 'public' 
          AND table_name = 'trading_accounts' 
          AND grantee IN ('anon', 'authenticated')
        ORDER BY grantee, privilege_type;
      `
    });
    
    if (error) {
      console.log('❌ Could not check permissions:', error.message);
    } else {
      console.log('✅ Current permissions:');
      if (permissions && permissions.length > 0) {
        permissions.forEach(perm => {
          console.log(`   - ${perm.grantee}: ${perm.privilege_type}`);
        });
      } else {
        console.log('   - No permissions found for anon/authenticated roles');
      }
    }
  } catch (err) {
    console.log('❌ Could not check permissions:', err.message);
  }
  
  console.log('\n🔒 RLS test completed!');
}

testRLSFix().catch(console.error);