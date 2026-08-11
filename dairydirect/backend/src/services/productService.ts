import { productRepository } from '../repositories/productRepository';
import { Product } from '../models/product';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const productService = {
  async listProducts(params: {
    category?: string;
    activeOnly?: boolean;
    brand?: string;
    isDealOfTheDay?: boolean;
    search?: string;
    sellerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    return productRepository.findAll(params);
  },

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  },

  async createProduct(data: {
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
    variants?: Array<{
      weight: string;
      price: number;
      original_price?: number;
      cost_price?: number;
      stock?: number;
      batch_number?: string;
      expiry_date?: string;
    }>;
  }): Promise<Product> {
    // Validate that price >= cost_price for each variant (Profit margin guard)
    if (data.variants) {
      for (const v of data.variants) {
        const costPrice = v.cost_price ?? (v as any).costPrice;
        if (costPrice !== undefined && v.price < costPrice) {
          throw new ValidationError(
            `Selling price (₹${v.price}) cannot be less than cost price (₹${costPrice}) for variant ${v.weight}`
          );
        }
      }
    }

    return productRepository.create(data);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const updated = await productRepository.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Product not found');
    }
    return updated;
  },

  async deleteProduct(id: string, permanent = false): Promise<boolean> {
    const deleted = await productRepository.delete(id, permanent);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }
    return true;
  },

  async updateStock(variantId: string, stock: number, costPrice?: number, batchNumber?: string): Promise<void> {
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundError('Product variant not found');
    }

    await productRepository.updateVariantStock(variantId, stock, costPrice, batchNumber);
  },
};
