"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AddressScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState('morning1');

  const addresses = [
    { id: 1, type: 'Home', text: '14, Green Park Society, Satellite, Ahmedabad, 380015' },
    { id: 2, type: 'Work', text: 'Silver Radiance, Sindhu Bhavan Road, Bodakdev, Ahmedabad, 380054' }
  ];

  const slots = [
    { id: 'morning1', time: '6:00 AM - 8:00 AM', avail: 'Fastest' },
    { id: 'morning2', time: '8:00 AM - 10:00 AM', avail: 'Available' },
    { id: 'evening', time: '5:00 PM - 7:00 PM', avail: 'Available' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-cream pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-sand shadow-sm">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2">
            <ArrowLeft className="w-6 h-6 text-dark" />
          </button>
          <h1 className="text-[22px] font-bold text-dark">Checkout</h1>
        </div>
        <div className="flex items-center justify-center pb-4 px-4">
          <div className="flex items-center w-full max-w-[200px] justify-between">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary mb-1"></div>
              <span className="text-[10px] font-bold text-primary">Address</span>
            </div>
            <div className="flex-1 h-[2px] bg-sand mx-2 -mt-4"></div>
            <div className="flex flex-col items-center opacity-50">
              <div className="w-3 h-3 rounded-full border-2 border-sand mb-1"></div>
              <span className="text-[10px] font-bold text-muted">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-dark mb-4">Deliver to</h2>
          
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div 
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={cn(
                  "p-4 rounded-[16px] border transition-all cursor-pointer flex gap-3",
                  selectedAddress === addr.id 
                    ? "border-primary bg-mint/10 shadow-sm" 
                    : "border-sand bg-white"
                )}
              >
                <div className="pt-1">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedAddress === addr.id ? "border-primary" : "border-sand"
                  )}>
                    {selectedAddress === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-dark text-sm">{addr.type}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed pr-6">{addr.text}</p>
                </div>
              </div>
            ))}

            <button className="w-full p-4 rounded-[16px] border border-dashed border-clay text-clay bg-white hover:bg-clay/5 flex items-center justify-center font-semibold text-sm transition-colors">
              <Plus className="w-5 h-5 mr-2" /> Add New Address
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-dark mb-4">Choose Delivery Slot</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {slots.map((slot) => (
              <div 
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={cn(
                  "p-4 rounded-[12px] border transition-all cursor-pointer flex justify-between items-center",
                  selectedSlot === slot.id 
                    ? "border-primary bg-primary text-white shadow-active" 
                    : "border-sand bg-white text-dark"
                )}
              >
                <span className="font-bold text-sm tracking-wide">{slot.time}</span>
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-[260px] p-4 bg-white border-t border-sand z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[800px] mx-auto">
          <Link href="/checkout/payment" className="block w-full">
            <Button size="full" className="w-full shadow-active text-lg" disabled={!selectedAddress || !selectedSlot}>
              Continue to Payment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
