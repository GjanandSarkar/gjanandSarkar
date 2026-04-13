"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Phone, MessageSquare, Star, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderTrackingMap from '@/components/shared/OrderTrackingMap';
import type { Coordinates } from '@/components/shared/MapComponent';

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const farmCoords: Coordinates = { lat: 23.0300, lng: 72.5800 }; 
  const customerCoords: Coordinates = { lat: 23.0225, lng: 72.5714 };
  
  const [driverCoords, setDriverCoords] = useState<Coordinates>({ lat: 23.0280, lng: 72.5780 });

  // Simulate smooth tracking movement
  useEffect(() => {
    let lat = driverCoords.lat;
    let lng = driverCoords.lng;
    
    const interval = setInterval(() => {
      // Very crude linear interpolation towards customer for the demo
      if (Math.abs(lat - customerCoords.lat) > 0.0001 || Math.abs(lng - customerCoords.lng) > 0.0001) {
        lat += (customerCoords.lat - lat) * 0.1;
        lng += (customerCoords.lng - lng) * 0.1;
        setDriverCoords({ lat, lng });
      } else {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container">
      {/* Header Over Map */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto transition-transform active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-[13px] font-bold pointer-events-auto">
          {orderId ? `Order #${orderId.substring(0, 8)}` : 'Live Tracking'}
        </div>
      </div>

      {/* Map Segment */}
      <div className="relative w-full" style={{ height: '55vh' }}>
        <OrderTrackingMap 
          farmLocation={farmCoords} 
          customerLocation={customerCoords} 
          driverLocation={driverCoords} 
          height="100%" 
        />
      </div>

      {/* Tracking Details Card */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-t-[32px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 -mt-8 relative"
      >
        <div className="w-12 h-1.5 bg-sand rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-end mb-6 border-b border-sand pb-6">
          <div>
            <h2 className="text-2xl font-black text-on-surface mb-1">Arriving in <span className="text-primary">12 min</span></h2>
            <p className="text-muted text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Expected by 7:15 AM
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-tertiary/10 text-tertiary-dark text-xs font-bold uppercase tracking-wide">
            On the way
          </div>
        </div>

        {/* Driver Profile */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-surface-container overflow-hidden border-2 border-surface">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Ramesh`} alt="Driver" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white text-white">
              <Star className="w-3 h-3 fill-current" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-base text-on-surface">Ramesh Kumar</h3>
            <p className="text-muted text-xs font-medium">GJ-01-AB-1234 • AC Van</p>
          </div>

          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform active:scale-95">
              <MessageSquare className="w-5 h-5 fill-current opacity-20" />
            </button>
            <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform active:scale-95">
              <Phone className="w-5 h-5 fill-current opacity-20" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-surface-container rounded-2xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] text-muted leading-relaxed font-medium">
            Your milk is kept below 4°C in our insulated fleet. Please keep an insulated bag available at your doorstep.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
