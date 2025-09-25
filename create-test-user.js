// Script to create a test user for debugging authentication flow
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpass123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (error) {
      console.error('Error creating user:', error);
      return;
    }
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password:', process.env.TEST_USER_PASSWORD || 'testpass123');
    console.log('User ID:', data.user.id);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();