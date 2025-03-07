import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase connection details from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables for Supabase connection.');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set in your .env file.');
  process.exit(1); // Exit the process with an error code
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get a public client (for authentication from the browser)
export const getPublicSupabaseConfig = () => {
  const publicKey = process.env.SUPABASE_ANON_KEY || '';
  return {
    url: supabaseUrl,
    key: publicKey
  };
};