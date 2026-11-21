"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Analytics } from '@/lib/analytics';
import { trackProductEvent } from '@/lib/analytics/session';
import { useStore } from '@/store/useStore';
import { updateCartItem, addToCart } from '@/lib/api/cart';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { ProductWithVariants } from '@/lib/api/products';
<<<<<<< HEAD
import { ChevronLeft, Heart, Plus, Minus, Star } from 'lucide-react';
import { RelatedProducts } from '@/components/discovery/RelatedProducts';
=======
import { 
  ChevronLeft, 
  ChevronRight,
  Heart, 
  Plus, 
  Minus, 
  Star, 
  Pencil,
  CheckCircle2,
  Send,
  MessageSquare,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { SubscriptionUpsellBanner } from '@/components/discovery/SubscriptionUpsellBanner';
import { RelatedProducts } from '@/components/discovery/RelatedProducts';
import { BrandStory } from '@/components/trust/BrandStory';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const scrollAmount = 140;
      thumbnailsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (quantity === 0) {
      addToCartLocal(product.id, selectedVariant.id);
      Analytics.trackEvent('Add to Cart', {
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant.id,
        price: selectedVariant.price,
        source: 'Buy Now'
      });
      if (user) {
        await updateCartItem(user.id, product.id, selectedVariant.id, 1);
      }
    }
    router.push('/checkout');
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

<<<<<<< HEAD
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
=======
  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background text-foreground transition-colors duration-150">
      
      {/* Navigation Header */}
      <div className="w-full bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-30 px-4 md:px-8 py-3 transition-colors duration-150">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-muted cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
<<<<<<< HEAD
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
=======
          
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

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
<<<<<<< HEAD
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
=======
              onClick={handleToggleWishlist}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-surface border border-border shadow-2xs cursor-pointer ${
                isSaved ? 'text-rose-600' : 'text-foreground-muted hover:text-rose-500'
              }`}
              title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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

<<<<<<< HEAD
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
=======
      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div className="col-span-1 md:col-span-6 space-y-4 md:sticky md:top-20">
            {/* Primary Main Image - completely fills container with no empty spaces */}
            <div className="bg-surface rounded-2xl border border-border shadow-2xs aspect-square max-h-[460px] w-full relative overflow-hidden">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </div>
          )}
        </div>

<<<<<<< HEAD
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
=======
            {/* Multiple Gallery Images Selector with Direction Arrows & No Scrollbar */}
            {allImages.length > 1 && (
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollThumbnails('left')}
                  className="w-8 h-8 rounded-full bg-surface border border-border shadow-2xs flex items-center justify-center shrink-0 hover:bg-surface-muted transition-colors cursor-pointer text-foreground"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div 
                  ref={thumbnailsRef}
                  className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-surface ${
                        activeImageIdx === idx
                          ? 'border-primary ring-2 ring-primary/30 shadow-xs'
                          : 'border-border hover:border-foreground-muted opacity-70 hover:opacity-100'
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

                <button
                  type="button"
                  onClick={() => scrollThumbnails('right')}
                  className="w-8 h-8 rounded-full bg-surface border border-border shadow-2xs flex items-center justify-center shrink-0 hover:bg-surface-muted transition-colors cursor-pointer text-foreground"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Product Specs & Interactive Options */}
          <div className="col-span-1 md:col-span-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary-fixed border border-primary/20 px-2.5 py-0.5 rounded-md">
                  {product.category}
                </span>
                
                {averageRating !== null ? (
                  <div className="flex items-center gap-1 text-xs font-semibold text-foreground-muted">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary text-white font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-white text-white" />
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="tabular-nums">
                      ({ratedReviews.length}{' '}
                      {ratedReviews.length === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-foreground-muted">
                    No ratings yet
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                {product.name}
              </h1>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              {t('inclusiveTaxes')} · Delivered before 8 AM · UPI or cash
            </p>
          </div>

<<<<<<< HEAD
          {/* Pack size — plain buttons, selection shown by border + weight */}
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-medium text-foreground-muted">
                {t('selectSize') || 'Pack size'}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, idx) => {
=======
            {/* Variant / Pack Size Selector (Normal text look) & Inline Action Buttons */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Pack Size
                </h3>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-900/10 text-neutral-900 border border-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Only {availableStock} left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-fixed text-primary border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    In Stock ({availableStock} units)
                  </span>
                )}
              </div>

              {/* Text-based variant picker */}
              <div className="flex flex-wrap gap-3 pt-0.5">
                {product.product_variants.map((v, idx) => {
                  const isSelected = selectedVariantIdx === idx;
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  const vAvail = v.available_quantity !== undefined ? v.available_quantity : v.stock;
                  const selected = selectedVariantIdx === idx;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
<<<<<<< HEAD
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
=======
                      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                        isSelected ? 'bg-surface-muted' : 'hover:bg-surface-muted/50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </span>
                      <span className="text-xs sm:text-sm">
                        <span className={isSelected ? 'font-bold text-foreground' : 'font-normal text-foreground-muted'}>
                          {v.weight}
                        </span>
                        <span className="mx-1.5 text-foreground-muted">&bull;</span>
                        <span className={isSelected ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}>
                          ₹{v.price}
                        </span>
                      </span>
                      {vAvail <= 0 && (
                        <span className="text-[10px] text-rose-500 font-normal ml-0.5">(Sold out)</span>
                      )}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    </button>
                  );
                })}
              </div>

              {/* Inline Add to Cart & Buy Now Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-border/60">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="flex-1 h-11 bg-surface-muted text-foreground-muted font-semibold rounded-xl text-xs sm:text-sm cursor-not-allowed flex items-center justify-center border border-border"
                  >
                    Currently Out of Stock
                  </button>
                ) : (
                  <>
                    {quantity === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleUpdate('inc')}
                        className="flex-1 h-11 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-between h-11 bg-primary text-white rounded-xl px-3 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdate('dec')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-foreground shadow-2xs font-bold cursor-pointer hover:bg-surface-muted transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-white">{quantity} in Cart</span>
                        <button
                          type="button"
                          onClick={() => handleUpdate('inc')}
                          disabled={quantity >= availableStock}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-foreground shadow-2xs font-bold disabled:opacity-50 cursor-pointer hover:bg-surface-muted transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 h-11 bg-foreground hover:bg-foreground/90 active:scale-95 text-background font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Buy Now</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

<<<<<<< HEAD
          {isOutOfStock ? (
            <p className="text-[13px] font-semibold text-error">
              {t('outOfStock') || 'Out of stock'} — back soon
            </p>
          ) : isLowStock ? (
            <p className="text-[13px] font-semibold text-secondary-ink">
              {t('onlyLeftInStock', { amount: String(availableStock) })}
            </p>
          ) : null}
=======
            {/* Features / Highlights Points (Replacing square boxes) */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Product Highlights
              </h4>
              <ul className="space-y-2.5 text-xs text-foreground-muted">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">100% Farm fresh &mdash; sourced daily from certified local dairy farmers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Rigorous multi-stage quality and purity testing on every batch</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Zero preservatives, artificial hormones, or adulterants</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Maintained continuously under 4&deg;C cold-chain storage to your doorstep</span>
                </li>
              </ul>
            </div>

            {/* Expandable Description with Read More */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                About this Product
              </h4>
              <p className={`text-xs sm:text-sm text-foreground-muted leading-relaxed transition-all ${
                isDescriptionExpanded ? '' : 'line-clamp-3'
              }`}>
                {product.description || 'Farm-fresh dairy delivered straight from local farmers to your table with highest hygiene and quality standards.'}
              </p>
              {product.description && product.description.length > 100 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer pt-1 inline-flex items-center gap-1"
                >
                  <span>{isDescriptionExpanded ? 'Read less' : 'Read more'}</span>
                </button>
              )}
            </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

          <div className="hidden md:block">{addControl}</div>

          {averageRating !== null && (
            <p className="flex items-center gap-1 text-[13px] text-foreground-muted">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
              <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
              <span>· {ratedReviews.length} ratings</span>
            </p>
          )}

<<<<<<< HEAD
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
=======
            {/* Customer Reviews Section */}
            <div className="space-y-5">
              {/* Write a Review Card - Spacious, comfortable & non-jagged */}
              <form onSubmit={handleReviewSubmit} className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Write a Review</h4>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Share your experience regarding quality, freshness, and delivery.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-1">
                  <span className="text-xs text-foreground font-medium">Your Rating:</span>
                  <div className="flex items-center gap-1">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={newRating === star}
                        aria-label={`${star} star`}
                        onClick={() => setNewRating(star)}
<<<<<<< HEAD
                        className="grid h-8 w-8 place-items-center"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= newRating ? 'fill-warning text-warning' : 'text-border'
=======
                        className="p-1 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-border hover:text-amber-300'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                          }`}
                          aria-hidden
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-foreground-muted ml-2">
                      {newRating === 5 ? '5.0 - Excellent' : newRating === 4 ? '4.0 - Good' : newRating === 3 ? '3.0 - Average' : `${newRating}.0`}
                    </span>
                  </div>
<<<<<<< HEAD
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
=======
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about quality, freshness or taste..."
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-border text-foreground bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {reviewSuccess ? (
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review submitted successfully!</span>
                    </span>
                  ) : <div />}
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="h-10 px-5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </button>
                </form>

<<<<<<< HEAD
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
=======
              {/* Reviews List Card */}
              <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>Customer Reviews</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>
                      {averageRating !== null
                        ? `${averageRating.toFixed(1)} / 5.0 (${ratedReviews.length})`
                        : 'No reviews yet'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 divide-y divide-border/60">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">
                              {rev.user_name}
                            </span>
                            {rev.is_verified_buyer && (
                              <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-primary text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 border border-primary/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-foreground-muted">
                            {rev.created_at && !rev.created_at.includes('ago') && !rev.created_at.includes('Just now')
                              ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : (rev.created_at || 'Recently')}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(Math.min(5, Math.max(0, rev.rating ?? 0)))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>

                        {rev.title && (
                          <h5 className="text-xs font-bold text-foreground">{rev.title}</h5>
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-surface/95 backdrop-blur-md border-t border-border z-30 shadow-lg transition-colors duration-150">
        <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Price</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">₹{selectedVariant.price}</p>
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="flex-1 h-11 bg-surface-muted text-foreground-muted font-semibold rounded-xl text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5 border border-border"
            >
              <span>Currently Out of Stock</span>
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={() => handleUpdate('inc')}
              className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-xs active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between h-11 bg-primary text-white rounded-xl px-3 shadow-xs">
              <button
                onClick={() => handleUpdate('dec')}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-foreground shadow-2xs font-bold cursor-pointer hover:bg-surface-muted transition-colors"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-sm font-bold text-white">{quantity}</span>
              <button
                onClick={() => handleUpdate('inc')}
                disabled={quantity >= availableStock}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-foreground shadow-2xs font-bold disabled:opacity-50 cursor-pointer hover:bg-surface-muted transition-colors"
                title={quantity >= availableStock ? 'Maximum available stock reached' : undefined}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
