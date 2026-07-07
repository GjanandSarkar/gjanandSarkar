"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSelectorProps {
  className?: string;
}

export function LocationSelector({ className }: LocationSelectorProps) {
  const user = useStore(state => state.user);
  const checkoutAddressId = useStore(state => state.checkoutAddressId);
  const setCheckoutAddressId = useStore(state => state.setCheckoutAddressId);
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addresses = user?.saved_addresses || [];
  
  // If we have an active checkoutAddressId, find it by label (since id isn't in the schema, using label as id for now)
  const activeAddress = addresses.find(a => a.label === checkoutAddressId) || addresses[0] || { label: 'Home', address: '123 Dairy Road, Vasant Kunj' };

  return (
    <div className={cn("relative z-50", className)} ref={containerRef}>
      <button
        onClick={() => addresses.length > 1 && setIsOpen(!isOpen)}
        className="flex flex-col items-start justify-center transition-all hover:opacity-80 active:scale-95 group text-left w-full focus:outline-none"
        aria-label="Select delivery location"
      >
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
          <span className="text-[12px] md:text-caption font-bold text-foreground">Delivery to {activeAddress.label}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[11px] md:text-[13px] text-foreground-muted line-clamp-1 max-w-[120px] md:max-w-[200px]">
            {activeAddress.address}
          </span>
          {addresses.length > 1 && (
            <ChevronDown className={cn("w-3.5 h-3.5 text-foreground-muted shrink-0 group-hover:text-foreground transition-all duration-300", isOpen && "rotate-180")} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && addresses.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-64 bg-surface border border-sand rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {addresses.map((addr) => (
                <button
                  key={addr.label}
                  onClick={() => {
                    setCheckoutAddressId(addr.label);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{addr.label}</p>
                    <p className="text-xs text-foreground-muted line-clamp-1 mt-0.5">{addr.address}</p>
                  </div>
                  {activeAddress.label === addr.label && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
