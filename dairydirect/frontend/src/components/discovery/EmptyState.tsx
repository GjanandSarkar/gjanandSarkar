"use client";

import { Search, FolderX, PackageX, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'search' | 'category' | 'products' | 'orders' | 'cart';
  onClear?: () => void;
}

export function EmptyState({ type, onClear }: EmptyStateProps) {
  const { t } = useTranslation();
  
  const content = {
    search: {
      icon: <Search className="w-7 h-7 text-muted" />,
      title: 'No search results found',
      desc: 'We couldn\'t find any products matching your search. Try different keywords.',
      action: 'Clear Search'
    },
    category: {
      icon: <FolderX className="w-7 h-7 text-muted" />,
      title: 'Category is empty',
      desc: 'There are no active products in this category at the moment.',
      action: 'View All Categories'
    },
    products: {
      icon: <PackageX className="w-7 h-7 text-muted" />,
      title: 'No products available',
      desc: 'We are currently restocking our inventory. Please check back shortly.',
      action: 'Refresh'
    },
    orders: {
      icon: <ShoppingBag className="w-7 h-7 text-muted" />,
      title: 'No orders yet',
      desc: 'You haven\'t placed any orders with us yet. Start shopping fresh items.',
      action: 'Browse Products'
    },
    cart: {
      icon: <ShoppingCart className="w-7 h-7 text-muted" />,
      title: 'Your cart is empty',
      desc: 'You haven\'t added any products to your cart yet.',
      action: 'Start Shopping'
    }
  }[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center w-full max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-surface-muted border border-border text-foreground">
        {content.icon}
      </div>
      <h2 className="font-extrabold text-lg mb-1.5 text-foreground">
        {content.title}
      </h2>
      <p className="text-xs text-muted leading-relaxed mb-6">
        {content.desc}
      </p>
      
      {onClear ? (
        <button 
          onClick={onClear}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-foreground-inverse transition-all active:scale-95 shadow-sm cursor-pointer mb-6"
        >
          {content.action}
        </button>
      ) : (
        <Link 
          href="/home"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-foreground-inverse transition-all active:scale-95 shadow-sm mb-6"
        >
          {content.action}
        </Link>
      )}

      {(type === 'search' || type === 'cart' || type === 'orders') && (
        <div className="w-full pt-4 border-t border-border/60">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">Popular Categories</h3>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['Milk', 'Paneer', 'Ghee', 'Curd'].map((cat) => (
              <Link 
                key={cat}
                href={`/categories/${cat}`}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-foreground hover:border-primary transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
