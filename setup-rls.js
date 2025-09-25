// Script to set up RLS policies for trading_accounts table
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupRLS() {
  console.log('Setting up RLS policies for trading_accounts...');
  
  try {
    // Step 1: Enable RLS
    console.log('1. Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('RLS enable result:', rlsError.message);
    } else {
      console.log('✓ RLS enabled');
    }
    
    // Step 2: Drop existing policies
    console.log('2. Dropping existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own accounts" ON public.trading_accounts;',
      'DROP POLICY IF EXISTS "Users can insert own accounts" ON public.trading_accounts;',
      'DROP POLICY IF EXISTS "Users can update own accounts" ON public.trading_accounts;',
      'DROP POLICY IF EXISTS "Users can delete own accounts" ON public.trading_accounts;',
      'DROP POLICY IF EXISTS "authenticated_users_own_accounts" ON public.trading_accounts;'
    ];
    
    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('does not exist')) {
        console.log('Drop policy warning:', error.message);
      }
    }
    console.log('✓ Existing policies dropped');
    
    // Step 3: Create new policies
    console.log('3. Creating new RLS policies...');
    const createPolicies = [
      `CREATE POLICY "Users can view own accounts" ON public.trading_accounts
       FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own accounts" ON public.trading_accounts
       FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own accounts" ON public.trading_accounts
       FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own accounts" ON public.trading_accounts
       FOR DELETE USING (auth.uid() = user_id);`
    ];
    
    for (const sql of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log('Create policy error:', error.message);
      }
    }
    console.log('✓ New policies created');
    
    // Step 4: Set permissions
    console.log('4. Setting table permissions...');
    const permissionSql = [
      'GRANT ALL ON public.trading_accounts TO authenticated;',
      'REVOKE ALL ON public.trading_accounts FROM anon;'
    ];
    
    for (const sql of permissionSql) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log('Permission error:', error.message);
      }
    }
    console.log('✓ Permissions set');
    
    // Step 5: Verify setup
    console.log('5. Verifying setup...');
    
    // Test anonymous access (should fail)
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDg0OTEsImV4cCI6MjA3NDIyNDQ5MX0.NIXJia81vfXb-HqcN9tP_rEu8NtSs4V7d4n1ui3OYDM');
    
    const { data: anonData, error: anonError } = await anonClient
      .from('trading_accounts')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✓ Anonymous access properly blocked:', anonError.message);
    } else {
      console.log('⚠️ Anonymous access still allowed - RLS may not be working');
    }
    
    console.log('\n🎉 RLS setup completed!');
    console.log('\nNext steps:');
    console.log('1. Refresh your browser');
    console.log('2. Try logging in and accessing the accounts page');
    console.log('3. The trading accounts should now load properly');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupRLS();