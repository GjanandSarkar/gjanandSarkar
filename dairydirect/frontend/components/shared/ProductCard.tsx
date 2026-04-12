'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  weight: string;
  price: number;
  image: string;
}

export function ProductCard({ id, name, weight, price, image }: ProductCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex flex-col group"
    >
      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-low">
        <img alt={name} className="w-full h-full object-cover" src={image}/>
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-bold text-on-surface line-clamp-1">{name}</h4>
        <span className="text-[10px] text-muted-foreground font-medium">{weight}</span>
        <div className="flex justify-between items-center mt-3">
          <span className="text-primary font-bold">₹{price.toFixed(2)}</span>
          <button className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
