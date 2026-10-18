"use client";

import Link from 'next/link';
import { MapPin, ChevronRight, Plus } from 'lucide-react';
import type { UserAddress } from '@/lib/api/addresses';
import { Button } from '@/components/ui/Button';

interface AddressSnippetProps {
  addresses: UserAddress[];
  hideHeader?: boolean;
}

export function AddressSnippet({ addresses, hideHeader = false }: AddressSnippetProps) {
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
  const count = addresses.length;

  return (
    <div>
      {!hideHeader && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">Saved Addresses</h2>
          {count > 0 && (
            <Link href="/profile/saved-addresses" className="text-primary text-xs font-bold flex items-center hover:underline">
              Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {!defaultAddress ? (
        <div className="bg-surface rounded-xl p-5 border border-border text-center">
          <MapPin className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Saved Addresses</h3>
          <p className="text-[11px] text-muted mb-3">Add an address for faster checkout.</p>
          <Link href="/profile/saved-addresses">
            <Button size="sm" variant="outline" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
            </Button>
          </Link>
        </div>
      ) : (
        <Link href="/profile/saved-addresses" className="block">
          <div className="bg-surface rounded-xl p-3.5 border border-border flex items-start gap-3 hover:border-primary/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-foreground text-xs truncate capitalize">{defaultAddress.label}</h3>
                {defaultAddress.is_default && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-1.5 py-0.2 rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {defaultAddress.address}
              </p>
              {count > 1 && (
                <p className="text-[11px] font-bold text-primary mt-1.5">
                  + {count - 1} other {count - 1 === 1 ? 'address' : 'addresses'}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
          </div>
        </Link>
      )}
    </div>
  );
}
