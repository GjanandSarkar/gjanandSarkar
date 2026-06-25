"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getProductById } from '@/lib/api/products';
import { updateCartItem } from '@/lib/api/cart';
import type { ProductWithVariants } from '@/lib/api/products';
import { ChevronLeft, Share2, Heart, Plus, Minus, ShieldCheck, Truck, Star, Sparkles, Loader2 } from 'lucide-react';

export default function ProductDetailScreen() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useTranslation();
  
  const user = useStore(state => state.user);
  const cart = useStore(state => state.cart);
  const updateCartQuantityLocal = useStore(state => state.updateCartQuantityLocal);
  const addToCartLocal = useStore(state => state.addToCartLocal);
  const removeFromCartLocal = useStore(state => state.removeFromCartLocal);
  
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  useEffect(() => {
    if (id) {
      getProductById(id).then(data => {
        setProduct(data);
        setIsLoading(false);
      });
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return <div className="p-10 text-center">Product not found</div>;

  const selectedVariant = product.product_variants[selectedVariantIdx];
  if (!selectedVariant) return <div className="p-10 text-center">No variants available</div>;

  const cartItem = cart.find(item => item.productId === product.id && item.variantId === selectedVariant.id);
  const quantity = cartItem?.quantity || 0;

  const handleUpdate = async (type: 'inc' | 'dec') => {
    let newQuantity = type === 'inc' ? quantity + 1 : Math.max(0, quantity - 1);
    
    if (type === 'inc' && newQuantity > selectedVariant.stock) return;

    if (newQuantity === 0) {
      removeFromCartLocal(product.id, selectedVariant.id);
    } else if (quantity === 0 && type === 'inc') {
      addToCartLocal(product.id, selectedVariant.id);
    } else {
      updateCartQuantityLocal(product.id, selectedVariant.id, newQuantity);
    }

    if (user) {
      await updateCartItem(user.id, product.id, selectedVariant.id, newQuantity);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="relative w-full bg-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/20 to-transparent">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
               <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
               <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <img 
          src={product.image_url || '/milk.png'} 
          alt={product.name} 
          className="w-full h-64 object-cover"
        />
        
        {product.is_freshness_guarantee && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg">
             <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.5} />
             <span className="text-xs font-bold text-primary uppercase tracking-wider">Fresh Guarantee</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="flex items-start justify-between mb-2">
          <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            {product.category}
          </div>
          <div className="flex items-center gap-1">
             <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
             <span className="text-sm font-bold">4.9</span>
             <span className="text-xs text-muted">(2.4k reviews)</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-on-surface mb-2">{product.name}</h1>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
          {product.description}
        </p>

        {/* Variants */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Available Sizes</h3>
          <div className="flex flex-wrap gap-2.5">
            {product.product_variants.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantIdx(idx)}
                className={`px-4 py-2.5 rounded-[12px] border-2 transition-all font-bold text-sm ${
                  selectedVariantIdx === idx 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-sand bg-white text-on-surface'
                }`}
              >
                {v.weight} — {t('currency')}{v.price}
                {v.stock < 10 && <span className="block text-[9px] font-medium text-amber-600">Only {v.stock} left</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-sand">
             <Truck className="w-5 h-5 text-primary" />
             <div>
               <p className="text-[11px] font-bold">Free Delivery</p>
               <p className="text-[10px] text-muted">Above {t('currency')}299</p>
             </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-sand">
             <ShieldCheck className="w-5 h-5 text-primary" />
             <div>
               <p className="text-[11px] font-bold">Lab Tested</p>
               <p className="text-[10px] text-muted">Quality Checked</p>
             </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-sand z-30">
        <div className="flex items-center justify-between gap-6 max-w-xl mx-auto">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Price</p>
            <p className="text-2xl font-black text-primary">{t('currency')}{selectedVariant.price}</p>
          </div>
          
          {quantity === 0 ? (
            <button
               onClick={() => handleUpdate('inc')}
               className="flex-1 h-14 bg-primary text-white font-bold rounded-[18px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between h-14 bg-primary/5 border-2 border-primary/20 rounded-[18px] px-2">
              <button 
                onClick={() => handleUpdate('dec')}
                className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white text-primary shadow-sm"
              >
                 <Minus className="w-5 h-5" strokeWidth={3} />
              </button>
              <span className="text-lg font-black text-primary">{quantity}</span>
              <button 
                onClick={() => handleUpdate('inc')}
                disabled={quantity >= selectedVariant.stock}
                className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-primary text-white shadow-sm disabled:opacity-50"
              >
                 <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
