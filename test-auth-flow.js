// Script to test authentication flow programmatically
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

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    // Test sign in
    console.log('Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpass123'
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