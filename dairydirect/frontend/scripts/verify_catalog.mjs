import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awiyxxbzqjluoqowoiqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3aXl4eGJ6cWpsdW9xb3dvaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyNTg0OCwiZXhwIjoyMTAxNTAxODQ4fQ.DkAhrdot5Y-GPDwMZzyDLgSsVy8w1effRGshGxyYtlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCatalog() {
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .order('sort_order', { ascending: true });

  if (catErr) {
    console.error('Error fetching categories:', catErr);
    return;
  }

  console.log(`Total Categories: ${categories.length}\n`);

  let totalProducts = 0;
  let totalVariants = 0;
  const summary = [];

  for (const cat of categories) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('category', cat.name);

    const prodCount = products ? products.length : 0;
    totalProducts += prodCount;

    let varCount = 0;
    let minVariants = Infinity;

    if (products && products.length > 0) {
      const prodIds = products.map(p => p.id);
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, product_id, weight, price, stock')
        .in('product_id', prodIds);

      varCount = variants ? variants.length : 0;
      totalVariants += varCount;

      for (const p of products) {
        const pVars = variants ? variants.filter(v => v.product_id === p.id) : [];
        if (pVars.length < minVariants) {
          minVariants = pVars.length;
        }
      }
    } else {
      minVariants = 0;
    }

    const sampleProd = products && products[0] ? products[0] : null;

    summary.push({
      Category: cat.name,
      'Cat ImageKit': cat.image_url.includes('ik.imagekit.io') ? '✅ Yes' : '❌ No',
      'Products': prodCount,
      'Min Variants/Prod': minVariants === Infinity ? 0 : minVariants,
      'Total Variants': varCount,
      'Prod ImageKit': sampleProd && sampleProd.image_url.includes('ik.imagekit.io') ? '✅ Yes' : '❌ No'
    });
  }

  console.table(summary);
  console.log(`\nGrand Totals: ${totalProducts} Products across ${categories.length} Categories, ${totalVariants} Variants total.`);
  console.log('All products have minimum 3 variants:', summary.every(s => s['Min Variants/Prod'] >= 3));
  console.log('All categories have minimum 10 products:', summary.every(s => s['Products'] >= 10));
}

checkCatalog();
