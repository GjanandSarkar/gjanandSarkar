import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log('Sample data:', data);
    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
