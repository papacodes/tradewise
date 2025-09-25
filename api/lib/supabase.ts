import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env['VITE_SUPABASE_URL']
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for backend')
}

// Create Supabase client with service role key for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create regular client for user operations
const supabaseAnonKey = process.env['VITE_SUPABASE_ANON_KEY']
if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key for backend')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)