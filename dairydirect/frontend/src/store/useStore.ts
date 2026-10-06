/**
 * Gjanand Sarkar — Zustand Store
 *
 * Only UI state lives here:
 *  - language preference + translations cache
 *  - auth user info (synced from Supabase session)
 *  - local cart state (mirror of DB, synced on login)
 *  - wishlist state (synced with DB)
 *  - seller store state
 *  - loading flags per feature
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';
import type { TranslationMap } from '@/lib/api/translations';

export type { Language };

// ─── Cart item shape (local mirror of cart_items table) ───────
export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

// ─── User shape (from profile row) ───────────────────────────
export type User = {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  address?: string;
  country?: string;
  saved_addresses?: { label: string; address: string }[];
  role: 'customer' | 'admin' | 'seller';
  /** Real balance from `profiles.loyalty_points`; orders accrue into it. */
  loyalty_points?: number;
};

// ─── Seller Store shape ──────────────────────────────────────
export type SellerLifecycleStatus =
  | 'active'
  | 'pending'
  | 'pending_kyc'
  | 'pending_inquiry'
  | 'suspended'
  | 'under_review'
  | 'deactivated'
  | 'permanently_deactivated'
  | 'reactivation_requested'
  | 'rejected';

export type SellerStore = {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  state: string;
  plan: 'starter' | 'growth' | 'enterprise';
  commission_rate: number;
  status: SellerLifecycleStatus;
  gstin?: string;
  pan?: string;
  total_revenue?: number;
  review_started_at?: string | null;
  review_expires_at?: string | null;
  review_reason?: string | null;
  deactivation_reason?: string | null;
  reactivation_reason?: string | null;
};

// ─── App State ────────────────────────────────────────────────
type AppState = {
  // ── Auth ──────────────────────────────────────────────────
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;

  // ── Seller Info ───────────────────────────────────────────
  sellerStore: SellerStore | null;
  setSellerStore: (store: SellerStore | null) => void;

  // ── Language + Translations ───────────────────────────────
  language: Language;
  setLanguage: (lang: Language) => void;
  translationsCache: Record<Language, TranslationMap>;
  setTranslationsCache: (lang: Language, map: TranslationMap) => void;

  // ── Local Cart (mirrors DB, synced on login) ───────────────
  cart: CartItem[];
  setCart: (items: CartItem[]) => void;
  addToCartLocal: (productId: string, variantId: string, quantity?: number) => void;
  updateCartQuantityLocal: (productId: string, variantId: string, quantity: number) => void;
  removeFromCartLocal: (productId: string, variantId: string) => void;
  clearCartLocal: () => void;

  // ── Wishlist (Product IDs) ─────────────────────────────────
  wishlist: string[];
  setWishlist: (productIds: string[]) => void;
  toggleWishlistLocal: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // ── UI / Loading ──────────────────────────────────────────
  isAuthLoading: boolean;
  setAuthLoading: (v: boolean) => void;
  isCartLoading: boolean;
  setCartLoading: (v: boolean) => void;
  isOrdersLoading: boolean;
  setOrdersLoading: (v: boolean) => void;
  isSubsLoading: boolean;
  setSubsLoading: (v: boolean) => void;

  // ── Checkout State (Temp) ──────────────────────────────────
  checkoutAddressId: string | null;
  setCheckoutAddressId: (id: string | null) => void;
  checkoutPaymentMethod: string | null;
  setCheckoutPaymentMethod: (method: string | null) => void;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────────
      user: null,

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          sellerStore: null,
          cart: [],
          wishlist: [],
        }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // ── Seller Store ───────────────────────────────────────
      sellerStore: null,
      setSellerStore: (sellerStore) => set({ sellerStore }),

      // ── Language + Translations ───────────────────────────
      language: 'en',

      setLanguage: (lang) => set({ language: lang }),

      translationsCache: { en: {}, hi: {}, gu: {} },

      setTranslationsCache: (lang, map) =>
        set((state) => ({
          translationsCache: { ...state.translationsCache, [lang]: map },
        })),

      // ── Local Cart ─────────────────────────────────────────
      cart: [],

      setCart: (items) => set({ cart: items }),

      addToCartLocal: (productId, variantId, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find(
            (i) => i.productId === productId && i.variantId === variantId
          );
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i === existing
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, { productId, variantId, quantity }] };
        }),

      updateCartQuantityLocal: (productId, variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter(
                (i) => !(i.productId === productId && i.variantId === variantId)
              ),
            };
          }
          return {
            cart: state.cart.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          };
        }),

      removeFromCartLocal: (productId, variantId) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      clearCartLocal: () => set({ cart: [] }),

      // ── Wishlist ───────────────────────────────────────────
      wishlist: [],
      setWishlist: (wishlist) => set({ wishlist }),
      toggleWishlistLocal: (productId) =>
        set((state) => {
          const exists = state.wishlist.includes(productId);
          return {
            wishlist: exists
              ? state.wishlist.filter((id) => id !== productId)
              : [...state.wishlist, productId],
          };
        }),
      isInWishlist: (productId) => get().wishlist.includes(productId),

      // ── UI / Loading ────────────────────────────────────────
      // IMPORTANT: Start as true so pages wait for Supabase session check
      // before deciding to redirect. AuthProvider sets this false after getSession().
      isAuthLoading: true,
      setAuthLoading: (v) => set({ isAuthLoading: v }),

      isCartLoading: false,
      setCartLoading: (v) => set({ isCartLoading: v }),

      isOrdersLoading: false,
      setOrdersLoading: (v) => set({ isOrdersLoading: v }),

      isSubsLoading: false,
      setSubsLoading: (v) => set({ isSubsLoading: v }),

      // ── Checkout Selection ─────────────────────────────────
      checkoutAddressId: null,
      setCheckoutAddressId: (id) => set({ checkoutAddressId: id }),
      checkoutPaymentMethod: 'upi',
      setCheckoutPaymentMethod: (method) => set({ checkoutPaymentMethod: method }),
    }),
    {
      name: 'gjanand-sarkar-storage',
      partialize: (state) => ({
        user: state.user,
        sellerStore: state.sellerStore,
        language: state.language,
        // NOTE: translationsCache is intentionally NOT persisted — it's large and
        // re-fetched idly per session. Persisting it caused slow store hydration.
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    }
  )
);
