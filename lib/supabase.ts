import { createClient } from '@supabase/supabase-js';

// These environment variables securely point to your cloud project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Export a single instance of the client to be used across the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);