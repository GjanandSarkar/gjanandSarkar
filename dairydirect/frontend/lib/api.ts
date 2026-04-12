const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

type RawVariant = {
  label?: string;
  price?: number | string;
};

type RawProduct = {
  id?: string;
  name?: string;
  category?: string;
  price?: number | string;
  weight?: string;
  image?: string;
  image_url?: string;
  badge?: string | null;
  variants?: RawVariant[];
  product_variants?: RawVariant[];
};

export type ApiProduct = {
  id: string;
  name: string;
  weight: string;
  price: number;
  badge: string | null;
  image: string;
  category: string;
};

const categoryMap: Record<string, string> = {
  MILK: 'Milk',
  PANEER: 'Paneer',
  GHEE: 'Ghee',
  BUTTERMILK: 'Buttermilk',
};

function normalizeCategory(category?: string): string {
  if (!category) return 'Milk';
  return categoryMap[category] || category;
}

function pickPrimaryVariant(product: RawProduct): RawVariant | undefined {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants[0];
  }
  if (Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    return product.product_variants[0];
  }
  return undefined;
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeProduct(product: RawProduct): ApiProduct {
  const variant = pickPrimaryVariant(product);

  return {
    id: String(product.id || crypto.randomUUID()),
    name: product.name || 'Dairy Product',
    weight: product.weight || variant?.label || '1 unit',
    price: toNumber(product.price ?? variant?.price),
    badge: product.badge || null,
    image:
      product.image ||
      product.image_url ||
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    category: normalizeCategory(product.category),
  };
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products (${response.status})`);
  }

  const payload = await response.json();
  const rawProducts = payload?.products || payload?.data || [];

  if (!Array.isArray(rawProducts)) {
    return [];
  }

  return rawProducts.map(normalizeProduct);
}
