"use client";

import Link from 'next/link';
import { MapPin, ChevronRight, Plus } from 'lucide-react';
import type { UserAddress } from '@/lib/api/addresses';
import { Button } from '@/components/ui/Button';

interface AddressSnippetProps {
  addresses: UserAddress[];
}

export function AddressSnippet({ addresses }: AddressSnippetProps) {
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
  const count = addresses.length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-black text-dark tracking-wide">Saved Addresses</h2>
        {count > 0 && (
          <Link href="/profile/saved-addresses" className="text-primary text-sm font-bold flex items-center hover:opacity-80 transition-opacity">
            Manage <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        )}
      </div>

      {!defaultAddress ? (
        <div className="bg-white rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <MapPin className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Saved Addresses</h3>
          <p className="text-sm text-muted mb-4 font-medium">Add an address for faster checkout.</p>
          <Link href="/profile/saved-addresses">
            <Button size="sm" variant="outline" className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Address
            </Button>
          </Link>
        </div>
      ) : (
        <Link href="/profile/saved-addresses" className="block">
          <div className="bg-white rounded-[20px] p-4 border border-sand/50 shadow-sm flex items-start gap-4 hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-mint/30 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-dark text-sm truncate">{defaultAddress.label}</h3>
                {defaultAddress.is_default && (
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-muted line-clamp-2 leading-relaxed">
                {defaultAddress.address}
              </p>
              {count > 1 && (
                <p className="text-[11px] font-bold text-primary mt-2">
                  + {count - 1} other {count - 1 === 1 ? 'address' : 'addresses'}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted shrink-0 mt-2" />
          </div>
        </Link>
      )}
    </div>
  );
}
