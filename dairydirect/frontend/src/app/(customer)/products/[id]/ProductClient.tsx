"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Analytics } from '@/lib/analytics';
import { trackProductEvent } from '@/lib/analytics/session';
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
import { RelatedProducts } from '@/components/discovery/RelatedProducts';
import { ProductQualityReport } from '@/components/trust/ProductQualityReport';
import { BrandStory } from '@/components/trust/BrandStory';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { PartnerBadge } from '@/components/shared/PartnerBadge';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { getProductReviews, submitProductReview, ReviewItem } from '@/lib/api/reviews';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface ProductClientProps {
  product: ProductWithVariants;
}

export function ProductClient({ product: initialProduct }: ProductClientProps) {
  const router = useRouter();
  const { t, tProduct, tCategory } = useTranslation();

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

  /**
   * Average rating, derived only from ratings that actually exist.
   *
   * The display previously did three unsound things: it treated a missing or
   * zero rating as 5 stars (`r.rating || 5`), inflating the average; it fell
   * back to `product.rating`, which the schema defaults to 4.80; and if that
   * was absent it printed a flat "5.0". A product with no reviews at all
   * therefore advertised a perfect score.
   */
  const ratedReviews = reviews.filter(
    (r) => typeof r.rating === 'number' && r.rating > 0,
  );
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((acc, r) => acc + (r.rating as number), 0) /
        ratedReviews.length
      : null;
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
    // Also recorded first-party in product_events, which is what the
    // recommender learns from. The Analytics call above goes to a different
    // sink and is not queryable for scoring.
    trackProductEvent(product.id, 'view', { source: 'product_page' });
  }, [product.id, product.name, product.category]);

  useRealtimeInventory({
    productId: product.id,
    onUpdate: (liveVariant) => {
      setProduct((prev) => ({
        ...prev,
        product_variants: (prev.product_variants || []).map((v) =>
          v.id === liveVariant.variantId
            ? {
                ...v,
                stock: liveVariant.stock,
                available_quantity: liveVariant.availableQuantity,
                reserved_quantity: liveVariant.reservedQuantity,
                low_stock_threshold: liveVariant.lowStockThreshold,
              }
            : v
        ),
      }));
    },
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const allImages = (function() {
    const list: string[] = [];
    if (product.image_url) list.push(product.image_url);
    if (Array.isArray(product.gallery_images)) {
      product.gallery_images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.length > 0 ? list : [PLACEHOLDER_PRODUCT_IMAGE];
  })();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const currentImage = allImages[activeImageIdx] || allImages[0] || product.image_url || PLACEHOLDER_PRODUCT_IMAGE;

  const variants = product.product_variants || [];
  const selectedVariant = variants[selectedVariantIdx] || variants[0];
  if (!selectedVariant) return <div className="p-10 text-center">No variants available</div>;

  const availableStock = selectedVariant.available_quantity !== undefined 
    ? selectedVariant.available_quantity 
    : selectedVariant.stock;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= (selectedVariant.low_stock_threshold || 10);

  // Only a genuine, seller-entered original_price counts as a discount.
  const originalPrice = selectedVariant.original_price ?? null;
  const hasRealDiscount = originalPrice != null && originalPrice > selectedVariant.price;
  const discountPercent = hasRealDiscount
    ? Math.round(((originalPrice - selectedVariant.price) / originalPrice) * 100)
    : 0;

  const cartItem = cart.find(item => item.productId === product.id && item.variantId === selectedVariant.id);
  const quantity = cartItem?.quantity || 0;

  const handleUpdate = async (type: 'inc' | 'dec') => {
    let newQuantity = type === 'inc' ? quantity + 1 : Math.max(0, quantity - 1);

    if (type === 'inc' && newQuantity > availableStock) return;

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
      // Was `user?.name || 'Verified Buyer'`, which stamped every anonymous
      // review with a purchase-verification claim the platform had not
      // checked. Fabricated trust badges are precisely the pattern the
      // CCPA 2023 dark-patterns guidelines prohibit.
      userName: user?.name || 'Anonymous',
      rating: newRating,
      comment: newComment.trim(),
      // Was hardcoded to 'Gujarat' for every reviewer in the country.
      stateOrigin: undefined,
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
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      
      {/* Navigation Header */}
      <div className="w-full bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-30 px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-full hover:bg-surface-muted cursor-pointer min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={handleToggleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-surface border border-border shadow-xs cursor-pointer min-h-[44px] min-w-[44px] ${
                isSaved ? 'text-error' : 'text-foreground hover:text-error'
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
            <div className="bg-surface rounded-lg border border-border p-6 shadow-xs flex items-center justify-center aspect-square max-h-[460px] mx-auto w-full relative overflow-hidden">
              <img
                src={currentImage}
                alt={product.name}
                className="w-auto h-full max-h-[360px] object-contain transition-transform duration-200"
              />
            </div>

            {/* Multiple Gallery Images Selector */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 px-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 transition-colors cursor-pointer bg-surface min-h-[44px] min-w-[44px] ${
                      activeImageIdx === idx
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-border-hover opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <TrustBadges className="hidden md:grid" />
          </div>

          {/* Right Column: Detailed Product Specs & Interactive Options */}
          <div className="col-span-1 md:col-span-6 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-foreground-muted bg-surface-muted border border-border px-2.5 py-1 rounded-full">
                    {tCategory(product.category)}
                  </span>
                  <PartnerBadge />
                </div>
                
                {averageRating !== null ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary text-on-primary">
                      <Star className="w-3 h-3 fill-white text-white" />
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-foreground-muted tabular-nums">
                      ({ratedReviews.length}{' '}
                      {ratedReviews.length === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-foreground-muted">
                    {t('noRatingsYet')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                {tProduct(product.name)}
              </h1>
              <p className="text-sm sm:text-base text-foreground-muted mt-2.5 leading-relaxed">
                {tProduct(product.description)}
              </p>

              {/* Price */}
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl sm:text-[2rem] font-semibold text-foreground tabular-nums leading-none">
                  ₹{selectedVariant.price}
                </span>
                {hasRealDiscount && (
                  <>
                    <span className="text-base text-foreground-muted line-through tabular-nums">
                      MRP ₹{selectedVariant.original_price}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-highlight text-on-highlight text-xs font-semibold">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                {t('inclusiveTaxes')} · {selectedVariant.weight}
              </p>
            </div>

            {/* Variant Selector & Authoritative Realtime Stock Status */}
            <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-foreground-muted">
                  {t('selectSize') || 'Pack Size'}
                </h3>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-bg text-error border border-error/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                    {t('outOfStock') || 'Out of Stock'}
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-highlight border border-highlight/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-highlight" />
                    {t('onlyLeftInStock', { amount: String(availableStock) })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-primary border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t('inStock') || 'In Stock'} ({availableStock} {t('units')})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.product_variants.map((v, idx) => {
                  const vAvail = v.available_quantity !== undefined ? v.available_quantity : v.stock;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-4 py-2.5 rounded-lg border transition-colors font-medium text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
                        selectedVariantIdx === idx
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-border bg-surface text-foreground hover:border-border-hover'
                      }`}
                    >
                      <span>{v.weight} — ₹{v.price}</span>
                      {vAvail <= 0 && (
                        <span className="text-xs opacity-75 font-normal text-error">(Sold out)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <TrustBadges className="grid md:hidden" />

            {/* Quality Test Reports */}
            <ProductQualityReport productId={product.id} productName={product.name} />

            {/* Brand Story */}
            <BrandStory categoryName={product.category} />

            {/* Reviews list & Review box */}
            <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>{t('customerReviews') || 'Customer Reviews'}</span>
                </h3>
                <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-warning" />
                  <span>
                    {averageRating !== null
                      ? `${averageRating.toFixed(1)} / 5.0`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              {/* Review Input Box */}
              <form onSubmit={handleReviewSubmit} className="bg-surface-muted rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Write a review</h4>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted font-medium">Rating:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 focus:outline-none cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= newRating
                              ? 'fill-amber-400 text-warning'
                              : 'text-foreground-muted'
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
                  placeholder="Share your thoughts about quality, craftsmanship or performance..."
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-border text-foreground bg-surface focus:border-primary outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  {reviewSuccess && (
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submitted!</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="ml-auto px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Send className="w-3 h-3" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4 divide-y divide-border">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {rev.user_name}
                          </span>
                          {rev.is_verified_buyer && (
                            <span className="px-1.5 py-0.5 rounded-full bg-surface-muted text-primary text-xs font-medium flex items-center gap-0.5 border border-border">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-foreground-muted">
                          {rev.created_at && !rev.created_at.includes('ago') && !rev.created_at.includes('Just now')
                            ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : (rev.created_at || 'Recently')}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[...Array(Math.min(5, Math.max(0, rev.rating ?? 0)))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-warning" />
                        ))}
                      </div>

                      {rev.title && (
                        <h5 className="text-xs font-medium text-foreground">{rev.title}</h5>
                      )}

                      <p className="text-xs text-foreground-muted leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-foreground-muted text-xs font-medium">
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

      {/* Floating action bar */}
      <div className="pdp-action-bar px-4 py-3 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-foreground-muted">{t('total') || 'Price'}</p>
            <p className="text-xl sm:text-2xl font-semibold text-primary">₹{selectedVariant.price}</p>
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 h-11 bg-surface-muted text-foreground-muted font-medium rounded-lg text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>{t('outOfStock') || 'Currently Out of Stock'}</span>
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={() => handleUpdate('inc')}
              className="flex-1 h-11 bg-primary hover:bg-primary-hover text-on-primary font-medium rounded-lg shadow-xs active:scale-95 transition-all text-xs sm:text-sm cursor-pointer min-h-[44px]"
            >
              {t('addToCart') || 'Add to Cart'}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between h-11 bg-surface-muted border border-border rounded-lg px-3 min-h-[44px]">
              <button
                onClick={() => handleUpdate('dec')}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-surface text-foreground shadow-xs font-semibold cursor-pointer min-h-[36px] min-w-[36px]"
              >
                <Minus className="w-4 h-4 stroke-[2]" />
              </button>
              <span className="text-base font-semibold text-foreground tabular-nums">{quantity}</span>
              <button
                onClick={() => handleUpdate('inc')}
                disabled={quantity >= availableStock}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary shadow-xs font-semibold disabled:opacity-50 cursor-pointer min-h-[36px] min-w-[36px]"
                title={quantity >= availableStock ? 'Maximum available stock reached' : undefined}
              >
                <Plus className="w-4 h-4 stroke-[2]" />
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
            // `updated` is the narrow CatalogProduct shape; merge it over the
            // full detail record so detail-only fields are preserved.
            setProduct((prev) => ({
              ...prev,
              ...updated,
              category: updated.category ?? prev.category,
            }));
          }}
          onProductDeleted={() => {
            router.push('/home');
          }}
        />
      )}
    </div>
  );
}
