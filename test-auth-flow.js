// Script to test authentication flow programmatically
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfwoxmtooyzvldznoveu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDg0OTEsImV4cCI6MjA3NDIyNDQ5MX0.NIXJia81vfXb-HqcN9tP_rEu8NtSs4V7d4n1ui3OYDM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test sign in
    console.log('Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Session:', signInData.session ? 'Active' : 'None');
    
    // Test fetching user profile
    console.log('\nTesting profile fetch...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user?.id)
      .single();
    
    if (profileError) {
      console.log('Profile error (expected if no profile exists):', profileError.message);
    } else {
      console.log('✅ Profile fetched:', profile);
    }
    
    // Test fetching trading accounts
    console.log('\nTesting trading accounts fetch...');
    const { data: accounts, error: accountsError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', signInData.user?.id);
    
    if (accountsError) {
      console.log('Accounts error:', accountsError.message);
    } else {
      console.log('✅ Accounts fetched:', accounts?.length || 0, 'accounts');
    }
    
    // Test fetching trades
    console.log('\nTesting trades fetch...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', signInData.user?.id);
    
    if (tradesError) {
      console.log('Trades error:', tradesError.message);
    } else {
      console.log('✅ Trades fetched:', trades?.length || 0, 'trades');
    }
    
    // Sign out
    console.log('\nSigning out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Sign out error:', signOutError);
    } else {
      console.log('✅ Sign out successful!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAuthFlow();