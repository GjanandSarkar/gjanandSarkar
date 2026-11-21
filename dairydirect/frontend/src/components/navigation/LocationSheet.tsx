"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getUserAddresses, normalizeUserAddress, type UserAddress } from '@/lib/api/addresses';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet';
import { cn } from '@/lib/utils';

export function LocationSheet({ className }: { className?: string }) {
  const user = useStore((state) => state.user);
  const checkoutAddressId = useStore((state) => state.checkoutAddressId);
  const setCheckoutAddressId = useStore((state) => state.setCheckoutAddressId);

  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setUserAddresses([]);
      return;
    }

    if (user.saved_addresses && user.saved_addresses.length > 0) {
      setUserAddresses(
        user.saved_addresses.map((a, i) =>
          normalizeUserAddress({
            id: `saved-${i}`,
            user_id: user.id,
            label: a.label,
            address: a.address,
            is_default: i === 0,
            created_at: new Date().toISOString(),
          })
        )
      );
    } else {
      getUserAddresses(user.id).then((addrs) => {
        if (addrs && addrs.length > 0) setUserAddresses(addrs);
      });
    }
  }, [user?.id, user?.saved_addresses]);

  const activeAddress =
    userAddresses.find((a) => a.id === checkoutAddressId || a.label === checkoutAddressId) ||
    userAddresses.find((a) => a.is_default) ||
    userAddresses[0] ||
    (user?.address
      ? { id: 'default-profile', label: 'Default', address: user.address, user_id: user.id, is_default: true, created_at: '' }
      : null);

  const activeLabel = activeAddress?.label || 'Select Location';
  const activeSubtext = activeAddress?.address
    ? `${activeAddress.address.substring(0, 20)}...`
    : 'in 18 min';

  const renderAddressList = (onSelect?: () => void) => (
    <div className="max-h-60 overflow-y-auto p-1 space-y-1">
      {userAddresses.length > 0 ? (
        userAddresses.map((addr, idx) => {
          const isSelected = activeAddress?.id === addr.id || (activeAddress?.label === addr.label && activeAddress?.address === addr.address);
          return (
            <button
              key={addr.id || `addr-${idx}`}
              type="button"
              onClick={() => {
                setCheckoutAddressId(addr.id || addr.label);
                onSelect?.();
              }}
              className={cn(
                "w-full flex items-start justify-between p-2.5 rounded-lg transition-all text-left cursor-pointer",
                isSelected ? "bg-primary-fixed text-brand-ink border border-primary/30" : "hover:bg-surface-muted text-foreground"
              )}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[9px] bg-primary-fixed text-brand-ink px-1.5 py-0.5 rounded font-bold">Default</span>
                  )}
                </div>
                <p className="text-[11px] text-foreground-muted line-clamp-1 mt-0.5">{addr.address}</p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-brand-ink shrink-0 mt-1" />}
            </button>
          );
        })
      ) : (
        <div className="p-3 text-center">
          <p className="text-xs text-foreground-muted">No saved addresses</p>
          <Link href="/profile/saved-addresses" onClick={onSelect} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-ink hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add Address
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("flex items-center min-w-0", className)}>
      {/* Mobile Location Sheet */}
      <div className="md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button type="button" className="flex items-center gap-1.5 text-left cursor-pointer max-w-[190px] select-none" aria-label="Select delivery location">
              <MapPin className="w-3.5 h-3.5 text-brand-ink shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate flex items-center gap-0.5 leading-tight">
                  <span>{activeLabel}</span>
                  <ChevronDown className="w-3 h-3 text-foreground-muted shrink-0" />
                </span>
                <span className="text-[10px] text-foreground-muted truncate leading-tight mt-0.5">{activeSubtext}</span>
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Delivery Location</SheetTitle>
              <SheetDescription>Select an address for instant delivery in 18 min.</SheetDescription>
            </SheetHeader>
            <div className="py-2">
              {user ? (
                <>
                  {renderAddressList(() => setIsMobileOpen(false))}
                  <div className="pt-3 border-t border-border mt-3">
                    <Link href="/profile/saved-addresses" onClick={() => setIsMobileOpen(false)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-brand-ink bg-primary-fixed rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add New Address
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <p className="text-body-sm text-foreground-muted">Sign in to choose a saved address.</p>
                  <Link href="/login" onClick={() => setIsMobileOpen(false)} className="inline-flex items-center justify-center w-full py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs">
                    Login to Select Address
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Location Selector */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="h-11 flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-surface hover:bg-surface-muted border border-border transition-all text-left cursor-pointer max-w-[240px] select-none" aria-label="Select delivery address">
              <div className="w-7 h-7 rounded-lg bg-primary-fixed text-brand-ink flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate flex items-center gap-0.5 leading-tight">
                  <span>{activeLabel}</span>
                  <ChevronDown className="w-3 h-3 text-foreground-muted shrink-0" />
                </span>
                <span className="text-[10px] text-foreground-muted truncate leading-tight mt-0.5">in 18 min • {activeAddress?.address || 'Fast delivery'}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" collisionPadding={12} className="w-80 p-2 rounded-xl">
            <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-border">
              <span className="flex items-center gap-1.5 text-foreground font-bold text-xs"><MapPin className="w-3.5 h-3.5 text-brand-ink" /> Delivery Addresses</span>
              <Link href="/profile/saved-addresses" className="text-[11px] font-bold text-brand-ink hover:underline">Manage</Link>
            </DropdownMenuLabel>
            {user ? (
              <>
                {renderAddressList()}
                <DropdownMenuSeparator />
                <div className="pt-1">
                  <Link href="/profile/saved-addresses" className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-brand-ink bg-primary-fixed rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-foreground-muted">Sign in to view saved addresses</p>
                <Link href="/login" className="flex items-center justify-center w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-xs">Login to Select Address</Link>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
