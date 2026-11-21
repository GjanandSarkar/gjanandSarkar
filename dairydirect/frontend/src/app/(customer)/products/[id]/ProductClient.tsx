"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Analytics } from '@/lib/analytics';
import { trackProductEvent } from '@/lib/analytics/session';
import { useStore } from '@/store/useStore';
import { updateCartItem, addToCart } from '@/lib/api/cart';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { ProductWithVariants } from '@/lib/api/products';
import { ChevronLeft, Heart, Plus, Minus, Star } from 'lucide-react';
import { RelatedProducts } from '@/components/discovery/RelatedProducts';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { getProductReviews, submitProductReview, ReviewItem } from '@/lib/api/reviews';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface ProductClientProps {
  product: ProductWithVariants;
}

/**
 * Product page.
 *
 * Before: back bar + heart + admin edit, category pill + partner badge + a
 * green rating pill, discount pill, a bordered "pack size" card carrying three
 * stock pills, TrustBadges rendered twice (desktop and mobile), a quality-report
 * block, a brand-story block, a full review form above the fold, and a floating
 * action bar duplicating the add button.
 *
 * Now the page answers four questions in order: what is it, how much, which
 * pack, add to cart. Everything else (description, storage, FSSAI, quality
 * report, reviews) is collapsed under plain headings at the bottom, where it
 * costs the shopper nothing to skip.
 */
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

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  /**
   * Average rating, derived only from ratings that actually exist. A missing
   * rating used to be treated as 5 stars, so a product with no reviews could
   * advertise a perfect score.
   */
  const ratedReviews = reviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((acc, r) => acc + (r.rating as number), 0) / ratedReviews.length
      : null;

  const isSaved = wishlist.includes(product.id);

  const handleToggleWishlist = async () => {
    toggleWishlistLocal(product.id);
    if (user) await toggleWishlist(user.id, product.id);
  };

  useEffect(() => setProduct(initialProduct), [initialProduct]);

  useEffect(() => {
    getProductReviews(product.id).then(setReviews);
  }, [product.id]);

  useEffect(() => {
    Analytics.trackEvent('Product Viewed', {
      productId: product.id,
      productName: product.name,
      category: product.category,
    });
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
            : v,
        ),
      }));
    },
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const allImages = (function () {
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

  const availableStock =
    selectedVariant.available_quantity !== undefined
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

  const cartItem = cart.find((item) => item.productId === product.id && item.variantId === selectedVariant.id);
  const quantity = cartItem?.quantity || 0;

  const handleUpdate = async (type: 'inc' | 'dec') => {
    const newQuantity = type === 'inc' ? quantity + 1 : Math.max(0, quantity - 1);

    if (type === 'inc' && newQuantity > availableStock) return;

    if (newQuantity === 0) {
      removeFromCartLocal(product.id, selectedVariant.id);
    } else if (quantity === 0 && type === 'inc') {
      addToCartLocal(product.id, selectedVariant.id);
      Analytics.trackEvent('Add to Cart', {
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant.id,
        price: selectedVariant.price,
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
    if (!newComment.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    const res = await submitProductReview({
      productId: product.id,
      userId: user?.id || 'guest-' + Date.now(),
      // Never claim a purchase we have not verified.
      userName: user?.name || 'Anonymous',
      rating: newRating,
      comment: newComment.trim(),
      stateOrigin: undefined,
    });

    if (res.review) {
      setReviews([res.review, ...reviews]);
      setNewComment('');
    }
    setIsSubmittingReview(false);
  };

  const addControl = (
    <div className="flex w-full items-stretch gap-3">
      {isOutOfStock ? (
        <button
          disabled
          className="h-12 flex-1 rounded-lg bg-surface-muted text-sm font-semibold text-foreground-muted"
        >
          {t('outOfStock') || 'Out of stock'}
        </button>
      ) : quantity === 0 ? (
        <button
          type="button"
          onClick={() => handleUpdate('inc')}
          className="h-12 flex-1 rounded-lg bg-primary text-sm font-bold uppercase tracking-wide text-on-primary active:scale-[0.99]"
        >
          {t('addToCart') || 'Add to cart'}
        </button>
      ) : (
        <div className="flex h-12 flex-1 items-center justify-between rounded-lg bg-primary px-2 text-on-primary">
          <button
            type="button"
            onClick={() => handleUpdate('dec')}
            className="grid h-10 w-12 place-items-center"
            aria-label="Remove one"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-base font-bold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => handleUpdate('inc')}
            disabled={quantity >= availableStock}
            className="grid h-10 w-12 place-items-center disabled:opacity-50"
            aria-label="Add one more"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-28 md:pb-10">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-2 md:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 items-center gap-1 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
            aria-pressed={isSaved}
            className="grid h-11 w-11 place-items-center text-foreground"
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-error text-error' : ''}`} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-4 md:grid-cols-2 md:gap-10 md:px-6 md:py-8">
        {/* Image */}
        <div className="md:sticky md:top-20 md:self-start">
          <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-surface-muted">
            <img
              src={currentImage}
              alt={product.name}
              className="h-full w-full object-contain p-4"
            />
          </div>
          {allImages.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`Image ${idx + 1}`}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-surface-muted ${
                    activeImageIdx === idx ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
              {tProduct(product.name)}
            </h1>
            <p className="mt-1 text-[13px] text-foreground-muted">
              {selectedVariant.weight} · {tCategory(product.category)}
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                ₹{selectedVariant.price}
              </span>
              {hasRealDiscount && (
                <>
                  <span className="text-sm text-foreground-muted line-through tabular-nums">
                    ₹{originalPrice}
                  </span>
                  <span className="text-[13px] font-semibold text-secondary-ink">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              {t('inclusiveTaxes')} · Delivered before 8 AM · UPI or cash
            </p>
          </div>

          {/* Pack size — plain buttons, selection shown by border + weight */}
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-medium text-foreground-muted">
                {t('selectSize') || 'Pack size'}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, idx) => {
                  const vAvail = v.available_quantity !== undefined ? v.available_quantity : v.stock;
                  const selected = selectedVariantIdx === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      aria-pressed={selected}
                      disabled={vAvail <= 0}
                      className={`h-11 rounded-lg border px-4 text-[13px] font-semibold ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-foreground'
                      } ${vAvail <= 0 ? 'opacity-50' : ''}`}
                    >
                      {v.weight}
                      <span className="ml-1.5 font-normal text-foreground-muted">₹{v.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isOutOfStock ? (
            <p className="text-[13px] font-semibold text-error">
              {t('outOfStock') || 'Out of stock'} — back soon
            </p>
          ) : isLowStock ? (
            <p className="text-[13px] font-semibold text-secondary-ink">
              {t('onlyLeftInStock', { amount: String(availableStock) })}
            </p>
          ) : null}

          <div className="hidden md:block">{addControl}</div>

          {averageRating !== null && (
            <p className="flex items-center gap-1 text-[13px] text-foreground-muted">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
              <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
              <span>· {ratedReviews.length} ratings</span>
            </p>
          )}

          {/* Everything else, collapsed */}
          <div className="divide-y divide-border border-t border-border">
            <details className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
                Product details
                <Plus className="h-4 w-4 text-foreground-muted group-open:hidden" aria-hidden />
                <Minus className="hidden h-4 w-4 text-foreground-muted group-open:block" aria-hidden />
              </summary>
              <div className="pt-3 text-[13px] leading-relaxed text-foreground-muted">
                <p>{tProduct(product.description)}</p>
                <dl className="mt-3 grid grid-cols-2 gap-y-1.5">
                  <dt>Net quantity</dt>
                  <dd className="text-right font-medium text-foreground">{selectedVariant.weight}</dd>
                  <dt>Category</dt>
                  <dd className="text-right font-medium text-foreground">{tCategory(product.category)}</dd>
                  <dt>FSSAI licence</dt>
                  <dd className="text-right font-medium text-foreground">10724026000189</dd>
                </dl>
              </div>
            </details>

            <details className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
                Reviews{ratedReviews.length > 0 ? ` (${ratedReviews.length})` : ''}
                <Plus className="h-4 w-4 text-foreground-muted group-open:hidden" aria-hidden />
                <Minus className="hidden h-4 w-4 text-foreground-muted group-open:block" aria-hidden />
              </summary>

              <div className="space-y-4 pt-3">
                <form onSubmit={handleReviewSubmit} className="space-y-2">
                  <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={newRating === star}
                        aria-label={`${star} star`}
                        onClick={() => setNewRating(star)}
                        className="grid h-8 w-8 place-items-center"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= newRating ? 'fill-warning text-warning' : 'text-border'
                          }`}
                          aria-hidden
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="How was the quality?"
                    className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newComment.trim()}
                    className="h-10 w-full rounded-lg border border-primary text-[13px] font-semibold text-primary disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Posting…' : 'Post review'}
                  </button>
                </form>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-foreground">{rev.user_name}</span>
                          <span className="text-xs text-foreground-muted">
                            {rev.created_at && !rev.created_at.includes('ago') && !rev.created_at.includes('Just now')
                              ? new Date(rev.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : rev.created_at || 'Recently'}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(Math.min(5, Math.max(0, rev.rating ?? 0)))].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-warning text-warning" aria-hidden />
                          ))}
                        </div>
                        <p className="text-[13px] leading-relaxed text-foreground-muted">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-foreground-muted">No reviews yet.</p>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <RelatedProducts currentProductId={product.id} category={product.category} />

      {/* Sticky buy bar — phones only, so the CTA is reachable one-handed. */}
      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,56px)+env(safe-area-inset-bottom,0px))] z-30 border-t border-border bg-surface px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-[64px]">
            <p className="text-lg font-semibold leading-none tabular-nums text-foreground">
              ₹{selectedVariant.price}
            </p>
            <p className="mt-0.5 text-[11px] text-foreground-muted">{selectedVariant.weight}</p>
          </div>
          {addControl}
        </div>
      </div>

      {user?.role === 'admin' && (
        <ProductEditModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProductUpdated={(updated) => {
            setProduct((prev) => ({
              ...prev,
              ...updated,
              category: updated.category ?? prev.category,
            }));
          }}
          onProductDeleted={() => router.push('/home')}
        />
      )}
    </div>
  );
}
