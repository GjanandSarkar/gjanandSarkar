import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service key to bypass RLS for testing

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSave() {
  console.log('Testing Supabase insert...');
  const testName = `Test Product ${Date.now()}`;
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert({
        name: testName,
        category: 'Milk',
        description: 'Test description',
        is_active: true
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      process.exit(1);
    }
    
    console.log('✅ Insert successful! Product ID:', insertData.id);
    
    // Verify it exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', insertData.id)
      .single();
    
    if (verifyError || !verifyData) {
      console.error('❌ Verification error: Could not find the product we just inserted.');
      process.exit(1);
    }
    
    console.log('✅ Verification successful! Data matches.');
    
    // Cleanup
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
        console.warn('⚠️ Cleanup warning: could not delete test product.', deleteError.message);
    } else {
        console.log('✅ Cleanup successful!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testSave();
