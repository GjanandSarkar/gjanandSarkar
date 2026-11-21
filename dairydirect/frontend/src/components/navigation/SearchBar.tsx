"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ROTATING_SEARCH_HINTS = [
  'Search for "Gir Cow A2 Milk"',
  'Search for "Pure Bilona Ghee"',
  'Search for "Fresh Malai Paneer"',
  'Search for "Cold-Pressed Mustard Oil"',
  'Search for "Organic Farm Butter"',
  'Search for "Traditional Indian Sweets"',
];

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [hintIndex, setHintIndex] = useState(0);

  // Rotating placeholder
  useEffect(() => {
    const hintTimer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % ROTATING_SEARCH_HINTS.length);
    }, 3000);
    return () => clearInterval(hintTimer);
  }, []);

  // Synchronize with URL query params
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) {
      queryParams.set('search', searchTerm.trim());
    }
    const queryStr = queryParams.toString();
    router.push(`/search${queryStr ? `?${queryStr}` : ''}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        "w-full h-11 relative flex items-center bg-surface hover:bg-surface-muted/50 border border-border rounded-full shadow-xs focus-within:border-brand-ink focus-within:ring-2 focus-within:ring-ring transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)] overflow-hidden",
        className
      )}
      role="search"
    >
      <div className="pl-4 pr-2 text-brand-ink pointer-events-none shrink-0">
        <Search className="w-4 h-4 stroke-[2.2]" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={ROTATING_SEARCH_HINTS[hintIndex]}
        aria-label="Search products"
        className="flex-1 min-w-0 py-2 pr-2 text-xs md:text-sm bg-transparent text-foreground placeholder:text-foreground-muted outline-none font-medium"
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="p-1.5 mr-2 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="submit"
          className="text-foreground-muted hover:text-brand-ink p-1.5 mr-2.5 rounded-full transition-colors cursor-pointer"
          aria-label="Submit search"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      )}
    </form>
  );
}

