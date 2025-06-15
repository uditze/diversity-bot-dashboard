import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// We will throw an error if the variables are not set when the server runs
if (!supabaseUrl || !supabaseKey) {
  console.log("Supabase URL or Key environment variables are not set yet. This is expected until deployment.");
}

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
