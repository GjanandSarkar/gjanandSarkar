/**
 * DairyDirect — Zustand Store
 *
 * Only UI state lives here:
 *  - language preference + translations cache
 *  - auth user info (synced from Supabase session)
 *  - local cart state (mirror of DB, synced on login)
 *  - loading flags per feature
 *
 * All persistent data (orders, subscriptions, products) is fetched
 * directly from Supabase in the pages/components that need them.
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
  phone?: string;
  email?: string;
  avatar_url?: string;
  address?: string;
  saved_addresses?: { label: string; address: string }[];
  role: 'customer' | 'admin';
};

// ─── App State ────────────────────────────────────────────────
type AppState = {
  // ── Auth ──────────────────────────────────────────────────
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;

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
          cart: [], // clear local cart on logout (DB cart persists)
        }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

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

      // ── UI / Loading ────────────────────────────────────────
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
      name: 'dairydirect-storage',
      // Only persist UI preferences, not loading states
      partialize: (state) => ({
        user: state.user,
        language: state.language,
        translationsCache: state.translationsCache,
        cart: state.cart,
      }),
    }
  )
);
