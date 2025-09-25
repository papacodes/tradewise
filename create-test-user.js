// Script to create a test user for debugging authentication flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfwoxmtooyzvldznoveu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmd294bXRvb3l6dmxkem5vdmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY0ODQ5MSwiZXhwIjoyMDc0MjI0NDkxfQ.eBJpZY7Ajus6gQo3jdP5odbBl58D22O1xkLPuiVaG2w';

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
      password: 'testpass123',
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
    console.log('Password: testpass123');
    console.log('User ID:', data.user.id);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();