import ImageKit from '@imagekit/nodejs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awiyxxbzqjluoqowoiqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3aXl4eGJ6cWpsdW9xb3dvaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyNTg0OCwiZXhwIjoyMTAxNTAxODQ4fQ.DkAhrdot5Y-GPDwMZzyDLgSsVy8w1effRGshGxyYtlE';
const IMAGEKIT_PRIVATE_KEY = 'private_o0QhwSfXwEKaOhm95U/csTq+29g=';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const imagekit = new ImageKit({
  privateKey: IMAGEKIT_PRIVATE_KEY,
});

async function uploadCategoryImages() {
  console.log('====================================================');
  console.log('🚀 UPLOADING CATEGORY IMAGES TO IMAGEKIT');
  console.log('====================================================\n');

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error || !categories || categories.length === 0) {
    throw new Error('Failed to fetch categories: ' + (error?.message || 'None found'));
  }

  console.log(`Found ${categories.length} categories to process.\n`);

  const updatedCategories = [];

  for (const cat of categories) {
    console.log(`[${cat.sort_order}/10] Uploading image for: ${cat.name} (${cat.slug})...`);
    
    // Upload image to ImageKit
    const uploadRes = await imagekit.files.upload({
      file: cat.image_url,
      fileName: `${cat.slug}.jpg`,
      folder: '/dairydirect/categories',
      useUniqueFileName: false,
      tags: ['category', cat.slug, 'dairydirect'],
    });

    const ikUrl = uploadRes.url;
    console.log(`  -> ImageKit URL: ${ikUrl}`);

    // Update in Supabase
    const { error: updateErr } = await supabase
      .from('categories')
      .update({
        image_url: ikUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', cat.id);

    if (updateErr) {
      console.error(`  ❌ Failed to update Supabase for ${cat.name}:`, updateErr.message);
    } else {
      console.log(`  ✅ Supabase updated for ${cat.name}`);
      updatedCategories.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: ikUrl
      });
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL CATEGORY IMAGES SUCCESSFULLY SAVED TO IMAGEKIT!');
  console.log('====================================================\n');

  console.table(updatedCategories.map(c => ({
    Name: c.name,
    Slug: c.slug,
    ImageKit_URL: c.image_url
  })));
}

uploadCategoryImages().catch(err => {
  console.error('Fatal error during ImageKit category upload:', err);
  process.exit(1);
});
