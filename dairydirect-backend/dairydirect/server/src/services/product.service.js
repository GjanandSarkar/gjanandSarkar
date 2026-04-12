// src/services/product.service.js — Product Business Logic

import { supabase, cc, dbError } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const PRODUCT_WITH_VARIANTS_SELECT = `
  id, name, category, description, image_url, is_active, created_at,
  product_variants!product_id(id, label, price, stock, is_active)
`;

/**
 * List all active products (optionally filter by category)
 */
export const listProducts = async ({ category } = {}) => {
  const validCategories = ['MILK', 'PANEER', 'GHEE', 'BUTTERMILK'];

  let query = supabase
    .from('products')
    .select(PRODUCT_WITH_VARIANTS_SELECT)
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (category) {
    const cat = category.toUpperCase();
    if (!validCategories.includes(cat)) {
      throw new ApiError(400, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    query = query.eq('category', cat);
  }

  const { data, error } = await query;
  dbError(error, 'Failed to fetch products');

  // Filter variants: only active ones, sorted by price asc
  const products = (data || []).map((p) => ({
    ...p,
    product_variants: (p.product_variants || [])
      .filter((v) => v.is_active)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
  }));

  return cc(products);
};

/**
 * Get single product by ID with all active variants
 */
export const getProductById = async (productId) => {
  const { data: product, error } = await supabase
    .from('products')
    .select(PRODUCT_WITH_VARIANTS_SELECT)
    .eq('id', productId)
    .single();

  if (error || !product) throw new ApiError(404, 'Product not found');
  if (!product.is_active) throw new ApiError(410, 'This product is no longer available');

  const result = cc(product);
  result.variants = result.productVariants
    ?.filter((v) => v.isActive)
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  delete result.productVariants;

  return result;
};

/**
 * Admin: Create a new product with variants
 */
export const createProduct = async (data) => {
  const { variants, ...productData } = data;

  const { data: product, error: productErr } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      category: productData.category,
      description: productData.description || null,
      image_url: productData.imageUrl || null,
      is_active: productData.isActive !== false,
    })
    .select('id')
    .single();

  dbError(productErr, 'Failed to create product');

  if (variants?.length) {
    const variantRows = variants.map((v) => ({
      product_id: product.id,
      label: v.label,
      price: v.price,
      stock: v.stock || 0,
      is_active: v.isActive !== false,
    }));

    const { error: variantErr } = await supabase.from('product_variants').insert(variantRows);
    dbError(variantErr, 'Failed to create product variants');
  }

  return getProductById(product.id);
};

/**
 * Admin: Toggle product active status
 */
export const toggleProductStatus = async (productId, isActive) => {
  const { data: existing, error: findErr } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();

  if (findErr || !existing) throw new ApiError(404, 'Product not found');

  const { data: product, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select('id, name, is_active')
    .single();

  dbError(error, 'Failed to update product');
  return cc(product);
};
