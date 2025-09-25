import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfwoxmtooyzvldznoveu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDg0OTEsImV4cCI6MjA3NDIyNDQ5MX0.NIXJia81vfXb-HqcN9tP_rEu8NtSs4V7d4n1ui3OYDM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuthFlow() {
  console.log('🧪 Testing frontend authentication flow...');
  
  try {
    // Step 1: Sign in with test credentials
    console.log('\n1. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Session exists:', !!signInData.session);
    
    // Step 2: Test trading_accounts query (this is what fails in the frontend)
    console.log('\n2. Testing trading_accounts query...');
    const { data: accounts, error: accountsError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', signInData.user?.id);
    
    if (accountsError) {
      console.log('❌ Trading accounts query failed:', accountsError.message);
      console.log('Error details:', accountsError);
    } else {
      console.log('✅ Trading accounts query successful!');
      console.log('Found', accounts.length, 'accounts');
      console.log('Accounts:', accounts);
    }
    
    // Step 3: Test without user_id filter (should still work due to RLS)
    console.log('\n3. Testing query without user_id filter...');
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('trading_accounts')
      .select('*');
    
    if (allAccountsError) {
      console.log('❌ All accounts query failed:', allAccountsError.message);
    } else {
      console.log('✅ All accounts query successful (RLS filtered)!');
      console.log('Found', allAccounts.length, 'accounts (should be same as filtered query)');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testFrontendAuthFlow();