"use client";

import { cn } from '@/lib/utils';
import { MapPin, Plus, Clock } from 'lucide-react';
import type { UserAddress } from '@/lib/api/addresses';
import Link from 'next/link';

interface AddressSelectionProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  slots: { id: string; time: string; avail: string }[];
  selectedSlot: string;
  onSelectSlot: (id: string) => void;
}

export function AddressSelection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  slots,
  selectedSlot,
  onSelectSlot
}: AddressSelectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Delivery Address */}
      <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Delivery Address</h3>
        </div>
        
        {addresses.length === 0 ? (
          <Link href="/profile/saved-addresses" className="block">
            <button className="w-full p-4 rounded-[16px] border border-dashed border-clay text-clay bg-white hover:bg-clay/5 flex items-center justify-center font-semibold text-sm transition-colors">
              <Plus className="w-5 h-5 mr-2" /> Add Delivery Address
            </button>
          </Link>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div 
                key={addr.id}
                onClick={() => onSelectAddress(addr.id)}
                className={cn(
                  "p-3 rounded-[16px] border transition-all cursor-pointer flex gap-3",
                  selectedAddressId === addr.id 
                    ? "border-primary bg-mint/10 shadow-sm" 
                    : "border-sand bg-white"
                )}
              >
                <div className="pt-1">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedAddressId === addr.id ? "border-primary" : "border-sand"
                  )}>
                    {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-0.5">
                    <span className="font-bold text-dark text-sm">{addr.label}</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2 pr-2">{addr.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Slot */}
      {addresses.length > 0 && (
        <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Delivery Slot</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {slots.map((slot) => (
              <div 
                key={slot.id}
                onClick={() => onSelectSlot(slot.id)}
                className={cn(
                  "p-3 rounded-[12px] border transition-all cursor-pointer flex justify-between items-center",
                  selectedSlot === slot.id 
                    ? "border-primary bg-primary text-white shadow-active" 
                    : "border-sand bg-white text-dark hover:border-primary/30"
                )}
              >
                <span className="font-bold text-xs tracking-wide">{slot.time}</span>
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                  selectedSlot === slot.id ? "bg-white/20" : "bg-mint/30 text-primary"
                )}>
                  {slot.avail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
