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
<<<<<<< HEAD
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-dark tracking-wide">Saved Addresses</h2>
=======
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">Saved Addresses</h2>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          {count > 0 && (
            <Link href="/profile/saved-addresses" className="text-primary text-xs font-bold flex items-center hover:underline">
              Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {!defaultAddress ? (
<<<<<<< HEAD
        <div className="bg-surface rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <MapPin className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Saved Addresses</h3>
          <p className="text-sm text-muted mb-4 font-medium">Add an address for faster checkout.</p>
=======
        <div className="bg-surface rounded-xl p-5 border border-border text-center">
          <MapPin className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Saved Addresses</h3>
          <p className="text-[11px] text-muted mb-3">Add an address for faster checkout.</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          <Link href="/profile/saved-addresses">
            <Button size="sm" variant="outline" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
            </Button>
          </Link>
        </div>
      ) : (
        <Link href="/profile/saved-addresses" className="block">
<<<<<<< HEAD
          <div className="bg-surface rounded-[20px] p-4 border border-sand/50 shadow-sm flex items-start gap-4 hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-mint/30 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
=======
          <div className="bg-surface rounded-xl p-3.5 border border-border flex items-start gap-3 hover:border-primary/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-foreground text-xs truncate capitalize">{defaultAddress.label}</h3>
                {defaultAddress.is_default && (
<<<<<<< HEAD
                  <span className="bg-primary/10 text-primary text-xs font-semibold uppercase px-2 py-0.5 rounded-md tracking-wider">
=======
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-1.5 py-0.2 rounded">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {defaultAddress.address}
              </p>
              {count > 1 && (
<<<<<<< HEAD
                <p className="text-xs font-bold text-primary mt-2">
=======
                <p className="text-[11px] font-bold text-primary mt-1.5">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
