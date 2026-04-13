import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToAdmin(phone: string) {
  console.log(`Checking profile for: ${phone}...`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('phone', phone)
    .select();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Success! User is now an admin.');
    console.log(data[0]);
  } else {
    console.log('❌ User not found. Make sure you have logged in at least once in the browser first.');
  }
}

// EDIT THIS NUMBER to your actual phone number
const myPhone = '+919876543210'; 

promoteToAdmin(myPhone);
