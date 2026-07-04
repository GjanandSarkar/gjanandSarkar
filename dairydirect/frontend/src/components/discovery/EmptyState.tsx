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
      icon: <Search className="w-8 h-8 text-outline" />,
      title: 'No search results found',
      desc: 'We couldn\'t find any products matching your search. Try adjusting your keywords.',
      action: 'Clear Search'
    },
    category: {
      icon: <FolderX className="w-8 h-8 text-outline" />,
      title: 'Category is empty',
      desc: 'There are no active products in this category at the moment.',
      action: 'View All Categories'
    },
    products: {
      icon: <PackageX className="w-8 h-8 text-outline" />,
      title: 'No products available',
      desc: 'We are currently restocking our inventory. Please check back later.',
      action: 'Refresh'
    },
    orders: {
      icon: <ShoppingBag className="w-8 h-8 text-outline" />,
      title: 'No Orders Yet',
      desc: 'Looks like you haven\'t placed any orders with us yet.',
      action: 'Browse Products'
    },
    cart: {
      icon: <ShoppingCart className="w-8 h-8 text-outline" />,
      title: 'Your cart is empty',
      desc: 'Looks like you haven\'t added any products to your cart yet.',
      action: 'Browse Products'
    }
  }[type];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-surface-container-low border border-outline-variant/30">
        {content.icon}
      </div>
      <h2 className="font-bold text-[20px] mb-2 text-on-surface">
        {content.title}
      </h2>
      <p className="text-[14px] max-w-[260px] leading-relaxed text-outline mb-8">
        {content.desc}
      </p>
      
      {onClear ? (
        <button 
          onClick={onClear}
          className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary-fixed text-primary transition-transform active:scale-95 mb-8"
        >
          {content.action}
        </button>
      ) : (
        <Link 
          href="/home"
          className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary-fixed text-primary transition-transform active:scale-95 mb-8"
        >
          {content.action}
        </Link>
      )}

      {(type === 'search' || type === 'cart' || type === 'orders') && (
        <div className="w-full max-w-[280px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Try Popular Categories</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {['Milk', 'Paneer', 'Ghee'].map((cat) => (
              <Link 
                key={cat}
                href={`/categories/${cat}`}
                className="px-4 py-2 bg-white border border-sand rounded-full text-sm font-medium hover:border-primary/30 transition-colors"
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
