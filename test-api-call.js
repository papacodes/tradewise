// Test the exact API call that's failing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfwoxmtooyzvldznoveu.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDg0OTEsImV4cCI6MjA3NDIyNDQ5MX0.NIXJia81vfXb-HqcN9tP_rEu8NtSs4V7d4n1ui3OYDM';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY0ODQ5MSwiZXhwIjoyMDc0MjI0NDkxfQ.eBJpZY7Ajus6gQo3jdP5odbBl58D22O1xkLPuiVaG2w';

async function testApiCall() {
  console.log('Testing the exact API call that failed...');
  console.log('URL: /rest/v1/trading_accounts?select=*&user_id=eq.fcad2c42-48fb-4cf7-9b4c-a7d1aeabd719');
  
  // Test with anon key (this is what the frontend uses)
  console.log('\n1. Testing with anon key (frontend simulation)...');
  const anonClient = createClient(supabaseUrl, anonKey);
  
  try {
    const { data: anonData, error: anonError } = await anonClient
      .from('trading_accounts')
      .select('*')
      .eq('user_id', 'fcad2c42-48fb-4cf7-9b4c-a7d1aeabd719');
    
    if (anonError) {
      console.log('❌ Anon request failed:', anonError);
    } else {
      console.log('✅ Anon request succeeded:', anonData);
    }
  } catch (error) {
    console.log('❌ Anon request threw error:', error);
  }
  
  // Test with service role key (admin access)
  console.log('\n2. Testing with service role key (admin access)...');
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    const { data: adminData, error: adminError } = await adminClient
      .from('trading_accounts')
      .select('*')
      .eq('user_id', 'fcad2c42-48fb-4cf7-9b4c-a7d1aeabd719');
    
    if (adminError) {
      console.log('❌ Admin request failed:', adminError);
    } else {
      console.log('✅ Admin request succeeded:', adminData);
    }
  } catch (error) {
    console.log('❌ Admin request threw error:', error);
  }
  
  // Test authenticated user simulation
  console.log('\n3. Testing with authenticated user simulation...');
  
  // First, let's see if we can authenticate with a test user
  try {
    // Check if there are any users in the system
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Could not list users:', usersError);
    } else {
      console.log('📋 Users in system:', users.users.length);
      
      // Find the user with the ID from the error
      const targetUser = users.users.find(u => u.id === 'fcad2c42-48fb-4cf7-9b4c-a7d1aeabd719');
      if (targetUser) {
        console.log('👤 Found target user:', targetUser.email);
      } else {
        console.log('❌ Target user not found in system');
      }
    }
  } catch (error) {
    console.log('❌ User lookup failed:', error);
  }
  
  // Test direct REST API call
  console.log('\n4. Testing direct REST API call...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/trading_accounts?select=*&user_id=eq.fcad2c42-48fb-4cf7-9b4c-a7d1aeabd719`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct REST call succeeded:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Direct REST call failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Direct REST call threw error:', error);
  }
}

testApiCall();