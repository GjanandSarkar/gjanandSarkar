"use client";

import { useRouter } from 'next/navigation';
import { MapPin, ChevronLeft, Plus, Trash2, Home, Briefcase, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SavedAddressesScreen() {
  const router = useRouter();

  const addresses = [
    { id: 1, type: 'Home', address: 'Plot 23, Satellite Apartments, Ahmedabad, Gujarat - 380015', icon: Home, isDefault: true },
    { id: 2, type: 'Office', address: 'Block C, Pinnacle Business Park, Prahlad Nagar, Ahmedabad - 380051', icon: Briefcase, isDefault: false },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 glass-surface px-5 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-on-surface tracking-tight">Saved Addresses</h1>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-4">
        {/* Add New */}
        <button 
          onClick={() => router.push('/onboarding/address')}
          className="w-full p-5 rounded-[24px] border-2 border-dashed border-primary/20 bg-primary/5 flex items-center gap-4 transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-[14px] bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <Plus className="w-6 h-6" strokeWidth={3} />
          </div>
          <div className="text-left">
            <p className="font-black text-primary text-[15px]">Add New Address</p>
            <p className="text-[11px] text-primary/60 font-bold uppercase tracking-wider">Use Current Location</p>
          </div>
        </button>

        <div className="space-y-4 pt-4">
          <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Your Addresses</h2>
          {addresses.map((addr) => {
            const Icon = addr.icon;
            return (
              <div key={addr.id} className="bg-white rounded-[24px] p-5 border border-sand shadow-sm relative overflow-hidden group">
                {addr.isDefault && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-bl-xl">
                    Default
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-surface-container flex items-center justify-center text-on-surface">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 pr-8">
                    <h3 className="font-black text-[16px] text-on-surface mb-1">{addr.type}</h3>
                    <p className="text-[13px] text-muted leading-relaxed font-medium">
                      {addr.address}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-sand/50">
                  <button className="text-[12px] font-bold text-primary px-2 py-1">Edit</button>
                  <button className="text-[12px] font-bold text-red-500 px-2 py-1 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
