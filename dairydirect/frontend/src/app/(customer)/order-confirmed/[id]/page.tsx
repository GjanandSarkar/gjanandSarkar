"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Package, Share2, MapPin, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n';
import React from 'react';

export default function OrderConfirmedScreen({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setOrderId(p.id);
    });
  }, [params]);

  return (
    <div className="flex flex-col min-h-screen bg-cream relative">
      <div className="flex-1 flex flex-col pt-16 px-6 relative z-10 pb-20">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-active"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-[26px] font-bold text-dark mb-1">Order Confirmed!</h1>
          <p className="text-muted text-sm font-medium">Your order #{orderId} is confirmed.</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-mint/20 border border-mint/50 rounded-[16px] p-4 flex items-start gap-4 mb-6 shadow-sm"
        >
          <div className="bg-white rounded-full p-2 shrink-0 shadow-sm text-primary">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-dark text-sm mb-1 mt-0.5">Estimated Delivery</h3>
            <p className="text-primary font-bold text-sm tracking-wide">Tomorrow, 7:00 AM - 9:00 AM</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-sand rounded-[16px] overflow-hidden shadow-sm mb-8"
        >
          <div className="p-4 border-b border-sand bg-sand/10">
            <h3 className="font-bold text-dark text-sm flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary" /> Delivery Details
            </h3>
          </div>
          <div className="p-4">
            <p className="text-muted text-sm leading-relaxed">
              Your order is being prepared and will be delivered to your selected address.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 mt-auto"
        >
          <Link href="/orders" className="block w-full">
            <Button size="full" className="w-full shadow-active text-lg">
              View All Orders
            </Button>
          </Link>
          <Link href="/home" className="block w-full">
            <Button variant="outline" size="full" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <button className="inline-flex items-center text-primary font-bold text-sm hover:underline">
            <Share2 className="w-4 h-4 mr-1.5" /> Share Receipt
          </button>
        </motion.div>
      </div>

      {/* Floating Leaves Animation Element (bg) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          initial={{ y: -100, x: -50, rotate: 0 }}
          animate={{ y: 800, x: 200, rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 opacity-10 text-mint"
        >
          <Leaf className="w-16 h-16" />
        </motion.div>
      </div>
    </div>
  );
}
