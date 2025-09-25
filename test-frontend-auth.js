import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuthFlow() {
  console.log('🧪 Testing frontend authentication flow...');
  
  try {
    // Step 1: Sign in with test credentials
    console.log('\n1. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpass123'
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