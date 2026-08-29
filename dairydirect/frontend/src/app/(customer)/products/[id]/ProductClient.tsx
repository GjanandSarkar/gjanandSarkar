"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Analytics } from '@/lib/analytics';
import { useStore } from '@/store/useStore';
import { updateCartItem, addToCart, removeFromCart } from '@/lib/api/cart';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { ProductWithVariants } from '@/lib/api/products';
import { 
  ChevronLeft, 
  Heart, 
  Plus, 
  Minus, 
  Star, 
  Pencil,
  CheckCircle2,
  Send,
  MessageSquare
} from 'lucide-react';
import { SubscriptionUpsellBanner } from '@/components/discovery/SubscriptionUpsellBanner';
import { RelatedProducts } from '@/components/discovery/RelatedProducts';
import { BrandStory } from '@/components/trust/BrandStory';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { getProductReviews, submitProductReview, ReviewItem } from '@/lib/api/reviews';

interface ProductClientProps {
  product: ProductWithVariants;
}

export function ProductClient({ product: initialProduct }: ProductClientProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const user = useStore((state) => state.user);
  const cart = useStore((state) => state.cart);
  const wishlist = useStore((state) => state.wishlist);
  const toggleWishlistLocal = useStore((state) => state.toggleWishlistLocal);
  const updateCartQuantityLocal = useStore((state) => state.updateCartQuantityLocal);
  const addToCartLocal = useStore((state) => state.addToCartLocal);
  const removeFromCartLocal = useStore((state) => state.removeFromCartLocal);

  const [product, setProduct] = useState<ProductWithVariants>(initialProduct);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const isSaved = wishlist.includes(product.id);

  const handleToggleWishlist = async () => {
    toggleWishlistLocal(product.id);
    if (user) {
      await toggleWishlist(user.id, product.id);
    }
  };

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    getProductReviews(product.id).then(setReviews);
  }, [product.id]);

  useEffect(() => {
    Analytics.trackEvent('Product Viewed', { 
      productId: product.id, 
      productName: product.name,
      category: product.category 
    });
  }, [product.id, product.name, product.category]);

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const variants = product.product_variants || [];
  const selectedVariant = variants[selectedVariantIdx] || variants[0];
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
      Analytics.trackEvent('Add to Cart', {
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant.id,
        price: selectedVariant.price
      });
    } else {
      updateCartQuantityLocal(product.id, selectedVariant.id, newQuantity);
    }

    if (user) {
      await updateCartItem(user.id, product.id, selectedVariant.id, newQuantity);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    const res = await submitProductReview({
      productId: product.id,
      userId: user?.id || 'guest-' + Date.now(),
      userName: user?.name || 'Verified Buyer',
      rating: newRating,
      comment: newComment.trim(),
      stateOrigin: 'Gujarat',
    });

    if (res.review) {
      setReviews([res.review, ...reviews]);
      setNewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    }
    setIsSubmittingReview(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-[#fafaf8]">
      
      {/* Premium Navigation Header */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30 px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-xs font-extrabold text-gray-700 hover:text-[#0f3e26] transition-colors py-1.5 px-3.5 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 rounded-full bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={handleToggleWishlist}
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all bg-white border border-gray-200 shadow-2xs cursor-pointer ${
                isSaved ? 'text-rose-600' : 'text-gray-700 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Image Gallery (Sticky on desktop) */}
          <div className="col-span-1 md:col-span-6 space-y-4 md:sticky md:top-24">
            <div className="bg-white rounded-3xl border border-sand/50 p-6 shadow-2xs flex items-center justify-center bg-gradient-to-b from-white to-[#fafaf8] aspect-square max-h-[460px] mx-auto w-full">
              <img
                src={product.image_url || '/milk.png'}
                alt={product.name}
                className="w-auto h-full max-h-[360px] object-contain transition-transform hover:scale-105 duration-500"
              />
            </div>
            <TrustBadges className="hidden md:grid" />
          </div>

          {/* Right Column: Detailed Product Specs & Interactive Options */}
          <div className="col-span-1 md:col-span-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#c88a23] bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                  {product.category}
                </span>
                
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-gray-900 font-extrabold">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : ((product as any).rating ? Number((product as any).rating).toFixed(1) : '5.0')}
                  </span>
                  <span className="text-gray-400">
                    ({reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variant Selector */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                Pack Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.product_variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`px-4 py-2.5 rounded-xl border transition-all font-bold text-xs cursor-pointer ${
                      selectedVariantIdx === idx
                        ? 'border-[#0f3e26] bg-[#0f3e26] text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <span>{v.weight} — ₹{v.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <TrustBadges className="grid md:hidden" />

            {/* Subscription Option */}
            <SubscriptionUpsellBanner category={product.category} />

            {/* Brand Story */}
            <BrandStory />

            {/* Reviews list & Review box */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#c88a23]" />
                  <span>Reviews</span>
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>
                    {reviews.length > 0
                      ? `${(reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)} / 5.0`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              {/* Review Input Box */}
              <form onSubmit={handleReviewSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-800">Write Review</h4>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium">Rating:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-0.5 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-4.5 h-4.5 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about quality, freshness or taste..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-900 bg-white focus:border-[#0f3e26] outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  {reviewSuccess && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submitted!</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="ml-auto px-4 py-2 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4 divide-y divide-gray-100">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">
                            {rev.user_name}
                          </span>
                          {rev.is_verified_buyer && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {rev.created_at && !rev.created_at.includes('ago') && !rev.created_at.includes('Just now')
                            ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : (rev.created_at || 'Recently')}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[...Array(Math.min(5, Math.max(1, rev.rating || 5)))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {rev.title && (
                        <h5 className="text-xs font-bold text-gray-800">{rev.title}</h5>
                      )}

                      <p className="text-xs text-gray-500 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-500 text-xs font-medium">
                    No customer reviews yet. Be the first to share your experience with this product!
                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            <RelatedProducts currentProductId={product.id} category={product.category} />
          </div>

        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price</p>
            <p className="text-xl sm:text-2xl font-black text-[#0f3e26]">₹{selectedVariant.price}</p>
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => handleUpdate('inc')}
              className="flex-1 h-12 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between h-12 bg-emerald-50 border border-emerald-200 rounded-xl px-3">
              <button
                onClick={() => handleUpdate('dec')}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#0f3e26] shadow-2xs font-black cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="text-base font-black text-[#0f3e26]">{quantity}</span>
              <button
                onClick={() => handleUpdate('inc')}
                disabled={quantity >= selectedVariant.stock}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0f3e26] text-white shadow-2xs font-black disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Edit Modal */}
      {user?.role === 'admin' && (
        <ProductEditModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProductUpdated={(updated) => {
            setProduct(updated);
          }}
          onProductDeleted={() => {
            router.push('/home');
          }}
        />
      )}
    </div>
  );
}
