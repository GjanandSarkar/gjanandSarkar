'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchProducts } from '@/lib/api';

export type Product = {
  id: string;
  name: string;
  weight: string;
  price: number;
  badge: string | null;
  image: string;
  category: string;
};

export type CartItem = Product & { qty: number };

export type Order = {
  id: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: CartItem[];
  total: number;
  deliveredDays: number | null;
};

export type Subscription = {
  id: string;
  productId: string;
  productName: string;
  status: 'Active' | 'Paused';
  detail: string;
  frequency: string;
  nextDelivery: string | null;
  image: string;
};

type AppState = {
  products: Product[];
  productsLoading: boolean;
  cart: CartItem[];
  orders: Order[];
  subscriptions: Subscription[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: () => void;
  toggleSubscription: (subId: string) => void;
  refreshProducts: () => Promise<void>;
};

const defaultProducts: Product[] = [
  { id: '1', name: 'Farm Fresh A2 Milk', weight: '1 Litre', price: 82, badge: 'FRESH', category: 'Milk', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCvIv_Fs1pemuQstmAo0P0T4Bkmtn6PdKehn3paUlc_HwSeWXJXAIlXOZdzT9yPHiBvCp4qlNVeq8KVVj6_h5-HwXbzZ5bWONc9q7TrU8RPTac9WdofgISjiuceKmBBd7ZRIbGWmqUUIh-C-nhFsWSMRpFBBQW48w8wdiIj83Ajc3CTbQZDqLwQDPs6eDE8quBUfGPVlyu0eiI7kYD8qhhjqnDwjgN8J8u8uHn-ok-dZFBGJIFI8uxJdBzD9ivetkBytK708V89xI' },
  { id: '2', name: 'Malai Paneer', weight: '200g', price: 110, badge: null, category: 'Paneer', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSmFRnnlFMDb_L0tfdRGbApomVZImFxIIYYLVqsPKFD3wBVGoPSb1925VzRfg10FzJS_lfpnW_JrJvY57vTnD2boTpbd32CCy9lyVW_fMzSYkG43xvX7VVlvDSDZfKESRgnNir3Uj8tMC1zsC6Z9mNwaPMXyKhjo5-HMxlSe5JAzb9svwgLQriLVzXQy2UuZJoONEiNPdORe7D_GthVG6ig9y7Dg5GNXcEGu1k1LJCJ-kXZa4LnSyDveeOsJXbZBTWFoS1vbCIfLA' },
  { id: '3', name: 'Pure Desi Ghee', weight: '500ml', price: 450, badge: 'BESTSELLER', category: 'Ghee', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHDfqqZxkIcJ-oZInWpFaTLZP2ZeSxcGcATUI1zrdtrMj0nzhB6b0XPdcL5r5KosAYVTC0Nk_Qz_pOKNXvrnkfrVfaKdttFbaI1kR2gpZbjd4NzsSdN-vpAXKgLiNVMUiF5o9EnqokanZIZHjqKVBwtqwLFgh91BNmAw061P9q56ZYlz4EZ3-IbYTjSufgramEy6ByGJLGLaimfweu33gN3zaM4GmxgxUdcY6peb3Vo5T_vcFbuHeCMIxEA3xY401si6MJ39MPkfU' },
  { id: '4', name: 'Probiotic Curd', weight: '400g', price: 65, badge: null, category: 'Buttermilk', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOVm--AFQORK8ogVrJRbbiJIgIlft37dvtOIzOflFtxNJ8Kp1vWazsB_5G1HcZ63a_ywzL2H3jq0DFCt_KqzQmjWZr23r6jOAjpSwAU1nhin3n8yFbFM6N9RYgZREidUgNDlzE1t8P_we6bpeSggChdWdpuehMGSfzw6hqyDM9ICREZ6etvwG0ZCEJgm5yVeCsuy72af4IBcLI6_bxZnY5quBIaOogVpiJ-ikoP7PFh-qP7vyaQiJ1S3WW2eVzHYS8wOfbsyDsCwg' },
];

const initialOrders: Order[] = [
  {
    id: 'DD-9021',
    date: 'Oct 24, 2023',
    status: 'OUT FOR DELIVERY',
    items: [ { ...defaultProducts[0], qty: 2 }, { ...defaultProducts[1], qty: 1 } ],
    total: 274,
    deliveredDays: null,
  },
  {
    id: 'DD-8842',
    date: 'Oct 20, 2023',
    status: 'DELIVERED',
    items: [ { ...defaultProducts[3], qty: 2 } ],
    total: 130,
    deliveredDays: 4,
  }
];

const initialSubs: Subscription[] = [
  {
    id: '1', status: 'Active', productName: 'Premium Whole Milk', productId: '1', detail: '2 Bottles · Weekly',
    nextDelivery: 'Monday, Oct 23', frequency: 'Weekly',
    image: defaultProducts[0].image,
  },
  {
    id: '2', status: 'Paused', productName: 'Artisanal Salted Butter', productId: '2', detail: '1 Pack · Bi-Weekly',
    nextDelivery: null, frequency: 'Bi-Weekly',
    image: defaultProducts[1].image,
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubs);

  const refreshProducts = async () => {
    try {
      setProductsLoading(true);
      const backendProducts = await fetchProducts();
      if (backendProducts.length > 0) {
        setProducts(backendProducts);
      }
    } catch {
      // Keep fallback products if API is unavailable.
      setProducts(defaultProducts);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === productId);
      if (existing && existing.qty > 1) {
        return prev.map(p => p.id === productId ? { ...p, qty: p.qty - 1 } : p);
      }
      return prev.filter(p => p.id !== productId);
    });
  };

  const clearCart = () => setCart([]);

  const checkout = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const newOrder: Order = {
      id: `DD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'PENDING',
      items: [...cart],
      total: total + 2.50 - 5.00, // + delivery - discount as per cart logic
      deliveredDays: null
    };
    setOrders([newOrder, ...orders]);
    clearCart();
  };

  const toggleSubscription = (subId: string) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        const isActive = sub.status === 'Active';
        return {
          ...sub,
          status: isActive ? 'Paused' : 'Active',
          nextDelivery: isActive ? null : 'Monday, Next Week'
        };
      }
      return sub;
    }));
  };

  return (
    <AppContext.Provider value={{ products, productsLoading, cart, orders, subscriptions, addToCart, removeFromCart, clearCart, checkout, toggleSubscription, refreshProducts }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export { defaultProducts };
