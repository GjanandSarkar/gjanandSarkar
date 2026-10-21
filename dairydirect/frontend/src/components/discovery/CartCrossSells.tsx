"use client";

import { useEffect, useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { useStore } from '@/store/useStore';
import { addToCart } from '@/lib/api/cart';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { FEATURED_CATEGORIES, relatedCategories } from '@/lib/constants/categories';

export function CartCrossSells() {
  const cart = useStore(state => state.cart);
  const user = useStore(state => state.user);
  const addToCartLocal = useStore(state => state.addToCartLocal);
  
  const [suggestions, setSuggestions] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCrossSells() {
      setIsLoading(true);
      try {
        const allProducts = await getProducts({ activeOnly: true });
        
        if (cart.length === 0) {
          // Empty cart: Suggest Best Sellers
          const bestSellers = allProducts
            .filter(p => p.product_variants.some(v => v.stock > 0))
            .slice(0, 4);
          setSuggestions(bestSellers);
          setIsLoading(false);
          return;
        }

        // Find categories currently in cart
        const cartProductIds = new Set(cart.map(item => item.productId));
        const cartCategories = new Set(
          allProducts.filter(p => cartProductIds.has(p.id)).map(p => p.category)
        );

        // Recommend complementary categories. The previous rule engine only
        // knew dairy sub-products, so a cart of electronics or fashion produced
        // no suggestions at all and silently fell back to milk and paneer.
        const targetCategories = new Set<string>();
        for (const cat of cartCategories) {
          for (const related of relatedCategories(cat)) {
            targetCategories.add(related);
          }
        }
        // Do not suggest what is already in the cart.
        for (const cat of cartCategories) {
          if (cat) targetCategories.delete(cat);
        }

        // Fallback to Best Sellers if no rules match or no target categories found
        if (targetCategories.size === 0) {
          for (const c of FEATURED_CATEGORIES) targetCategories.add(c.name);
        }

        // Filter products that match target categories and aren't already in cart, must be in stock
        const recommended = allProducts
          .filter(p => targetCategories.has(p.category) && !cartProductIds.has(p.id) && p.product_variants.some(v => v.stock > 0))
          .slice(0, 4);

        setSuggestions(recommended);
      } catch (err) {
        console.error('Failed to load cross sells:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCrossSells();
  }, [cart]);

  const handleAdd = async (product: ProductWithVariants) => {
    const variantId = product.product_variants[0]?.id;
    if (!variantId || addingId) return;

    setAddingId(product.id);
    addToCartLocal(product.id, variantId, 1);
    if (user) {
      await addToCart(user.id, product.id, variantId, 1);
    }
    setAddingId(null);
  };

  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-foreground">You might also like</h3>
      </div>
      
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="w-[110px] shrink-0 h-[140px] bg-surface-muted animate-pulse rounded-xl border border-border" />
            ))}
          </>
        ) : (
          <>
            {suggestions.map(product => (
              <div key={product.id} className="w-[115px] shrink-0 bg-surface border border-border rounded-xl p-2 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-surface-muted rounded-lg mb-1.5 flex items-center justify-center p-1 overflow-hidden border border-border/60">
                  <img src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE} alt={product.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-[11px] font-semibold text-foreground leading-tight mb-1 line-clamp-1 w-full">{product.name}</p>
                <p className="text-xs font-extrabold text-primary mb-1.5 mt-auto">₹{product.product_variants[0]?.price}</p>
                <button 
                  onClick={() => handleAdd(product)}
                  disabled={addingId === product.id}
                  className="w-full h-6 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-foreground-inverse text-[11px] font-bold flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> ADD
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
