"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Droplets, PackageSearch, Truck } from 'lucide-react';

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();

  const slides = [
    {
      id: 1,
      title: t('dailyFresh'),
      sub: t('dailyFreshSub'),
      illustration: <Droplets className="w-24 h-24 text-primary" />
    },
    {
      id: 2,
      title: t('ourProducts'),
      sub: t('ourProductsSub'),
      illustration: <PackageSearch className="w-24 h-24 text-primary" />
    },
    {
      id: 3,
      title: t('trackDelivery'),
      sub: t('trackDeliverySub'),
      illustration: <Truck className="w-24 h-24 text-primary" />
    }
  ];

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      router.push('/login');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative w-full md:grid md:grid-cols-2">
      {/* Mobile Skip Button */}
      <div className="absolute top-4 right-4 z-10 md:hidden">
        <button 
          type="button"
          onClick={handleSkip} 
          className="text-xs font-semibold text-foreground-muted hover:text-foreground px-3 py-1.5 rounded-lg bg-surface border border-border"
        >
          {t('skip')}
        </button>
      </div>

      {/* Visual Section */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 bg-surface md:border-r md:border-border md:h-screen">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-primary-fixed/60 border border-primary/20 rounded-3xl mb-8 flex items-center justify-center shadow-xs">
              {slides[currentSlide].illustration}
            </div>
            
            <div className="md:hidden">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 leading-tight">{slides[currentSlide].title}</h2>
              <p className="text-xs sm:text-sm text-foreground-muted max-w-[280px] mx-auto">{slides[currentSlide].sub}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section (Desktop handles differently) */}
      <div className="px-6 pb-12 pt-6 w-full flex flex-col items-center justify-center gap-8 md:h-screen md:bg-surface md:px-16">
        
        <div className="hidden md:flex justify-end w-full absolute top-8 right-8">
          <button 
            type="button"
            onClick={handleSkip} 
            className="text-xs font-semibold text-foreground-muted hover:text-foreground px-4 py-2 rounded-xl border border-border hover:bg-surface-muted transition-colors cursor-pointer"
          >
            {t('skip')}
          </button>
        </div>

        <div className="hidden md:block text-center mb-4">
          <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">{slides[currentSlide].title}</h2>
          <p className="text-sm text-foreground-muted max-w-[380px] mx-auto leading-relaxed">{slides[currentSlide].sub}</p>
        </div>

        <div className="flex gap-2 mb-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-border'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm">
          <button 
            type="button"
            onClick={handleNext} 
            className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            {currentSlide === slides.length - 1 ? t('getStarted') : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
}
