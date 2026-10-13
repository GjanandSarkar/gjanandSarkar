"use client";

import React from 'react';
import Link from 'next/link';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import {
  Menu,
  ChevronDown,
  Truck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  CATEGORIES,
  FEATURED_CATEGORIES,
  SECONDARY_CATEGORIES,
  categoryHref,
} from '@/lib/constants/categories';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';

export function CategoryNavBar() {
  const reducedCategories = FEATURED_CATEGORIES.map((c) => ({
    name: c.name,
    href: categoryHref(c),
    badge: c.badge,
    icon: c.icon,
  }));

  const allCategories = [
    { name: 'All Products', href: '/products', icon: 'LayoutGrid', description: 'Browse the full catalogue' },
    ...CATEGORIES.map((c) => ({
      name: c.name,
      href: categoryHref(c),
      icon: c.icon,
      description: c.description,
    })),
  ];

  const moreCategories = [
    ...SECONDARY_CATEGORIES.map((c) => ({
      name: c.name,
      href: categoryHref(c),
      desc: c.description,
      icon: c.icon,
    })),
    { name: 'View Complete Catalog', href: '/products', desc: 'All departments', icon: 'LayoutGrid' },
  ];

  return (
    <div className="w-full bg-surface border-b border-border/80 text-foreground relative z-30 shadow-2xs transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-start gap-3 lg:gap-8 h-11 md:h-12">
        
        {/* All Categories Dropdown (Radix DropdownMenu) */}
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 font-black text-foreground hover:text-primary transition-colors py-1.5 px-2.5 rounded-xl hover:bg-surface-muted cursor-pointer text-xs md:text-sm"
              >
                <Menu className="w-4 h-4 text-primary" />
                <span className="font-extrabold tracking-tight">All Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted opacity-70" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-72 max-h-[420px] overflow-y-auto p-1.5">
              <DropdownMenuLabel className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="flex items-center gap-1.5 text-secondary text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Explore Departments
                </span>
                <span className="text-muted text-[10px] font-normal">{CATEGORIES.length} items</span>
              </DropdownMenuLabel>

              <div className="py-1">
                {allCategories.map((cat) => (
                  <DropdownMenuItem key={cat.name} asChild>
                    <Link
                      href={cat.href}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors rounded-lg"
                    >
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <CategoryIcon name={cat.icon} />
                      </span>
                      <span>{cat.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-border/80 shrink-0 hidden sm:block" />

        {/* Category Nav Links (Horizontal Rail) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10 xl:gap-12 overflow-x-auto no-scrollbar py-1">
          {reducedCategories.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-foreground/90 hover:text-primary font-bold text-xs lg:text-[13px] tracking-tight hover:underline underline-offset-8 decoration-2 decoration-secondary transition-all whitespace-nowrap py-1 px-0.5 group flex items-center gap-1.5"
            >
              <span>{item.name}</span>
            </Link>
          ))}

          {/* More Dropdown (Radix DropdownMenu) */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-foreground/80 hover:text-primary font-bold text-xs lg:text-[13px] hover:bg-surface-muted py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted opacity-70" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-64 p-1.5">
                <DropdownMenuLabel className="text-[11px] font-black text-secondary uppercase tracking-wider pb-1 border-b border-border/60">
                  More Categories
                </DropdownMenuLabel>
                <div className="py-1">
                  {moreCategories.map((cat) => (
                    <DropdownMenuItem key={cat.name} asChild>
                      <Link
                        href={cat.href}
                        className="flex items-center gap-3 px-3 py-2 text-xs text-foreground hover:bg-surface-muted transition-colors rounded-lg"
                      >
                        <span className="w-5 h-5 flex items-center justify-center shrink-0">
                          <CategoryIcon name={cat.icon} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{cat.name}</p>
                          <p className="text-[10px] text-muted truncate">{cat.desc}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Right: Quick Delivery & Purity Badges (Country Delight / Zepto Style) */}
        <div className="ml-auto hidden xl:flex items-center gap-4 shrink-0 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold">Doorstep by 6:30 AM</span>
          </div>

          <div className="flex items-center gap-1.5 text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[11px] font-bold">100% Lab Tested Purity</span>
          </div>
        </div>

      </div>
    </div>
  );
}
