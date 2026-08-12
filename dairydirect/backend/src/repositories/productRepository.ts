import { query, getSupabaseAdmin } from '../config/database';
import { Product, ProductVariant } from '../models/product';

const now = new Date().toISOString();

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'A2 Gir Cow Milk',
    category: 'Milk',
    description: '100% Pure, unadulterated fresh raw milk from indigenous Gir cows in Gujarat.',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
    s3_image_key: null,
    is_active: true,
    is_freshness_guarantee: true,
    seller_id: null,
    state_origin: 'Gujarat',
    brand: 'Gjanand Farm',
    rating: 4.9,
    reviews_count: 128,
    is_deal_of_the_day: true,
    discount_pct: 10,
    tags: ['Pure', 'A2 Certified', 'Farm Fresh'],
    sort_order: 1,
    created_at: now,
    updated_at: now,
    variants: [
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        weight: '500 ml',
        price: 45.0,
        original_price: 50.0,
        cost_price: 32.0,
        stock: 80,
        low_stock_threshold: 15,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        weight: '1 Litre',
        price: 85.0,
        original_price: 95.0,
        cost_price: 62.0,
        stock: 150,
        low_stock_threshold: 20,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        product_id: 'a0000000-0000-0000-0000-000000000001',
        weight: '2 Litres',
        price: 165.0,
        original_price: 185.0,
        cost_price: 120.0,
        stock: 50,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Pure A2 Desi Cow Ghee',
    category: 'Ghee',
    description: 'Traditional Bilona method cultured ghee made from curd of A2 Gir cow milk.',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d',
    s3_image_key: null,
    is_active: true,
    is_freshness_guarantee: true,
    seller_id: null,
    state_origin: 'Gujarat',
    brand: 'Gjanand Farm',
    rating: 5.0,
    reviews_count: 94,
    is_deal_of_the_day: false,
    discount_pct: 0,
    tags: ['Bilona Method', 'Grass Fed', 'Pure Ghee'],
    sort_order: 2,
    created_at: now,
    updated_at: now,
    variants: [
      {
        id: 'b0000000-0000-0000-0000-000000000004',
        product_id: 'a0000000-0000-0000-0000-000000000002',
        weight: '500 ml',
        price: 950.0,
        original_price: 1050.0,
        cost_price: 700.0,
        stock: 40,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000005',
        product_id: 'a0000000-0000-0000-0000-000000000002',
        weight: '1 Litre',
        price: 1850.0,
        original_price: 2000.0,
        cost_price: 1350.0,
        stock: 60,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Farm Fresh Soft Paneer',
    category: 'Paneer',
    description: 'Handcrafted daily from fresh milk. Zero preservatives, ultra-soft and high in protein.',
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7',
    s3_image_key: null,
    is_active: true,
    is_freshness_guarantee: true,
    seller_id: null,
    state_origin: 'Gujarat',
    brand: 'Gjanand Farm',
    rating: 4.8,
    reviews_count: 62,
    is_deal_of_the_day: false,
    discount_pct: 0,
    tags: ['Fresh Made', 'High Protein', 'Preservative Free'],
    sort_order: 3,
    created_at: now,
    updated_at: now,
    variants: [
      {
        id: 'b0000000-0000-0000-0000-000000000006',
        product_id: 'a0000000-0000-0000-0000-000000000003',
        weight: '200g',
        price: 90.0,
        original_price: 100.0,
        cost_price: 65.0,
        stock: 50,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000007',
        product_id: 'a0000000-0000-0000-0000-000000000003',
        weight: '500g',
        price: 210.0,
        original_price: 230.0,
        cost_price: 155.0,
        stock: 40,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'A2 Gir Cow Curd (Dahi)',
    category: 'Curd',
    description: 'Naturally set probiotic curd with thick cream layer and authentic traditional taste.',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
    s3_image_key: null,
    is_active: true,
    is_freshness_guarantee: true,
    seller_id: null,
    state_origin: 'Gujarat',
    brand: 'Gjanand Farm',
    rating: 4.9,
    reviews_count: 45,
    is_deal_of_the_day: false,
    discount_pct: 0,
    tags: ['Probiotic', 'Thick Set', 'Natural'],
    sort_order: 4,
    created_at: now,
    updated_at: now,
    variants: [
      {
        id: 'b0000000-0000-0000-0000-000000000008',
        product_id: 'a0000000-0000-0000-0000-000000000004',
        weight: '400g',
        price: 50.0,
        original_price: 55.0,
        cost_price: 35.0,
        stock: 60,
        low_stock_threshold: 15,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b0000000-0000-0000-0000-000000000009',
        product_id: 'a0000000-0000-0000-0000-000000000004',
        weight: '1 kg',
        price: 115.0,
        original_price: 125.0,
        cost_price: 80.0,
        stock: 40,
        low_stock_threshold: 10,
        batch_number: null,
        expiry_date: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
  },
];

export const productRepository = {
  async findAll(params: {
    category?: string;
    activeOnly?: boolean;
    brand?: string;
    isDealOfTheDay?: boolean;
    search?: string;
    sellerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const {
      category,
      activeOnly = false,
      brand,
      isDealOfTheDay,
      search,
      sellerId,
      limit = 100,
      offset = 0,
    } = params;

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (activeOnly) {
        conditions.push(`p.is_active = true`);
      }

      if (category) {
        conditions.push(`LOWER(p.category) = LOWER($${idx++})`);
        values.push(category);
      }

      if (brand) {
        conditions.push(`p.brand = $${idx++}`);
        values.push(brand);
      }

      if (isDealOfTheDay !== undefined) {
        conditions.push(`p.is_deal_of_the_day = $${idx++}`);
        values.push(isDealOfTheDay);
      }

      if (sellerId) {
        conditions.push(`p.seller_id = $${idx++}`);
        values.push(sellerId);
      }

      if (search) {
        conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR p.category ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await query<{ count: string }>(
        `SELECT COUNT(*) FROM products p ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      const dataQuery = `
        SELECT
          p.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'product_id', pv.product_id,
                'weight', pv.weight,
                'price', pv.price,
                'original_price', pv.original_price,
                'cost_price', pv.cost_price,
                'stock', pv.stock,
                'low_stock_threshold', pv.low_stock_threshold,
                'batch_number', pv.batch_number,
                'expiry_date', pv.expiry_date,
                'is_active', pv.is_active,
                'created_at', pv.created_at,
                'updated_at', pv.updated_at
              ) ORDER BY pv.price ASC
            ) FILTER (WHERE pv.id IS NOT NULL),
            '[]'
          ) AS variants
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.sort_order ASC, p.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `;

      values.push(limit, offset);
      const dataRes = await query<Product>(dataQuery, values);

      if (dataRes.rows.length > 0) {
        return { products: dataRes.rows, total };
      }
    } catch {
      // Try Supabase fallback first
      try {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          let query = supabase.from('products').select('*, product_variants(*)', { count: 'exact' }).eq('is_active', true);

          if (category) {
            query = query.eq('category', category);
          }
          if (isDealOfTheDay !== undefined) {
            query = query.eq('is_deal_of_the_day', isDealOfTheDay);
          }
          if (search) {
            query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
          }

          const { data, error, count } = await query
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (!error && data && data.length > 0) {
            const formattedProducts = data.map((p: any) => {
              const { product_variants, ...rest } = p;
              return {
                ...rest,
                variants: product_variants || []
              };
            });
            return { products: formattedProducts, total: count || formattedProducts.length };
          }
        }
      } catch (err) {
        // Silent fail, proceed to default products
      }
    }


    let filtered = DEFAULT_PRODUCTS;
    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (isDealOfTheDay !== undefined) {
      filtered = filtered.filter((p) => p.is_deal_of_the_day === isDealOfTheDay);
    }
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    return { products: filtered, total: filtered.length };
  },

  async findById(id: string): Promise<Product | null> {
    try {
      const res = await query<Product>(
        `SELECT
          p.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'product_id', pv.product_id,
                'weight', pv.weight,
                'price', pv.price,
                'original_price', pv.original_price,
                'cost_price', pv.cost_price,
                'stock', pv.stock,
                'low_stock_threshold', pv.low_stock_threshold,
                'batch_number', pv.batch_number,
                'expiry_date', pv.expiry_date,
                'is_active', pv.is_active,
                'created_at', pv.created_at,
                'updated_at', pv.updated_at
              ) ORDER BY pv.price ASC
            ) FILTER (WHERE pv.id IS NOT NULL),
            '[]'
          ) AS variants
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id = $1
        GROUP BY p.id`,
        [id]
      );

      if (res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: prod } = await sb
          .from('products')
          .select('*, product_variants(*)')
          .eq('id', id)
          .maybeSingle();

        if (prod) {
          return {
            ...prod,
            variants: prod.product_variants || [],
          };
        }
      }
    }

    return DEFAULT_PRODUCTS.find((p) => p.id === id) || null;
  },

  async findVariantById(variantId: string): Promise<(ProductVariant & { product_name: string }) | null> {
    try {
      const res = await query<ProductVariant & { product_name: string }>(
        `SELECT pv.*, p.name AS product_name
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = $1`,
        [variantId]
      );
      if (res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: v } = await sb
          .from('product_variants')
          .select('*, products(name)')
          .eq('id', variantId)
          .maybeSingle();
        
        if (v) {
          return {
            ...v,
            product_name: v.products?.name || ''
          };
        }
      }
    }

    for (const prod of DEFAULT_PRODUCTS) {
      const v = (prod.variants || []).find((varItem) => varItem.id === variantId);
      if (v) {
        return { ...v, product_name: prod.name };
      }
    }
    return null;
  },

  async create(data: {
    name: string;
    category: string;
    description?: string;
    image_url?: string;
    seller_id?: string;
    brand?: string;
    state_origin?: string;
    is_deal_of_the_day?: boolean;
    discount_pct?: number;
    tags?: string[];
  }): Promise<Product> {
    try {
      const res = await query<Product>(
        `INSERT INTO products (
          name, category, description, image_url, seller_id, brand,
          state_origin, is_deal_of_the_day, discount_pct, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          data.name,
          data.category,
          data.description || null,
          data.image_url || null,
          data.seller_id || null,
          data.brand || 'Gjanand Farm',
          data.state_origin || 'Gujarat',
          data.is_deal_of_the_day || false,
          data.discount_pct || 0,
          data.tags || [],
        ]
      );
      return res.rows[0];
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: created, error } = await sb
          .from('products')
          .insert({
            name: data.name,
            category: data.category,
            description: data.description || null,
            image_url: data.image_url || null,
            seller_id: data.seller_id || null,
            brand: data.brand || 'Gjanand Farm',
            state_origin: data.state_origin || 'Gujarat',
            is_deal_of_the_day: data.is_deal_of_the_day || false,
            discount_pct: data.discount_pct || 0,
            tags: data.tags || [],
          })
          .select('*')
          .single();
        if (!error && created) return created;
      }
      throw new Error('Failed to create product');
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const fields: string[] = ['updated_at = now()'];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (
        [
          'name',
          'category',
          'description',
          'image_url',
          'is_active',
          'is_freshness_guarantee',
          'brand',
          'state_origin',
          'is_deal_of_the_day',
          'discount_pct',
          'tags',
          'sort_order',
        ].includes(key)
      ) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (values.length === 0) return this.findById(id);

    try {
      values.push(id);
      const res = await query<Product>(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return res.rows[0] ? this.findById(res.rows[0].id) : null;
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
        delete cleanUpdates.variants;
        const { error } = await sb.from('products').update(cleanUpdates).eq('id', id);
        if (!error) return this.findById(id);
      }
      return null;
    }
  },

  async delete(id: string, permanent = false): Promise<boolean> {
    if (permanent) {
      return this.hardDelete(id);
    }
    return this.softDelete(id);
  },

  async softDelete(id: string): Promise<boolean> {
    try {
      const res = await query('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
        return !error;
      }
      return false;
    }
  },

  async hardDelete(id: string): Promise<boolean> {
    try {
      const res = await query('DELETE FROM products WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb.from('products').delete().eq('id', id);
        return !error;
      }
      return false;
    }
  },

  async createVariant(data: {
    product_id: string;
    weight: string;
    price: number;
    original_price?: number;
    cost_price: number;
    stock: number;
    low_stock_threshold?: number;
    batch_number?: string;
    expiry_date?: string;
  }): Promise<ProductVariant> {
    try {
      const res = await query<ProductVariant>(
        `INSERT INTO product_variants (
          product_id, weight, price, original_price, cost_price,
          stock, low_stock_threshold, batch_number, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          data.product_id,
          data.weight,
          data.price,
          data.original_price || null,
          data.cost_price,
          data.stock,
          data.low_stock_threshold || 10,
          data.batch_number || null,
          data.expiry_date || null,
        ]
      );
      return res.rows[0];
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: vCreated, error } = await sb.from('product_variants').insert(data).select('*').single();
        if (!error && vCreated) return vCreated;
      }
      throw new Error('Failed to create variant');
    }
  },

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const fields: string[] = ['updated_at = now()'];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (
        [
          'weight',
          'price',
          'original_price',
          'cost_price',
          'stock',
          'low_stock_threshold',
          'batch_number',
          'expiry_date',
          'is_active',
        ].includes(key)
      ) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (values.length === 0) return null;

    try {
      values.push(id);
      const res = await query<ProductVariant>(
        `UPDATE product_variants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return res.rows[0] || null;
    } catch {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: vUpdated, error } = await sb.from('product_variants').update(updates).eq('id', id).select('*').maybeSingle();
        if (!error && vUpdated) return vUpdated;
      }
      return null;
    }
  },

  async updateVariantStock(
    variantId: string,
    stock: number,
    costPrice?: number,
    batchNumber?: string
  ): Promise<boolean> {
    const updates: Partial<ProductVariant> = { stock };
    if (costPrice !== undefined) updates.cost_price = costPrice;
    if (batchNumber !== undefined) updates.batch_number = batchNumber;
    const res = await this.updateVariant(variantId, updates);
    return !!res;
  },
};
