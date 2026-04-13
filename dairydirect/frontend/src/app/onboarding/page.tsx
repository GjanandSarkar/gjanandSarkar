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
      illustration: <Droplets className="w-32 h-32 text-primary" />
    },
    {
      id: 2,
      title: t('ourProducts'),
      sub: t('ourProductsSub'),
      illustration: <PackageSearch className="w-32 h-32 text-clay" />
    },
    {
      id: 3,
      title: t('trackDelivery'),
      sub: t('trackDeliverySub'),
      illustration: <Truck className="w-32 h-32 text-mint" />
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
    <div className="flex flex-col min-h-screen bg-cream relative w-full md:grid md:grid-cols-2">
      {/* Mobile Skip Button */}
      <div className="absolute top-4 right-4 z-10 md:hidden">
        <button onClick={handleSkip} className="text-sm font-medium text-muted hover:text-dark px-2 py-1">
          {t('skip')}
        </button>
      </div>

      {/* Visual Section */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 bg-white/40 md:bg-mint/10 md:h-screen">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className="w-64 h-64 bg-white/80 backdrop-blur-3xl rounded-full mb-10 flex items-center justify-center shadow-[0_20px_40px_-15px_rgba(160,205,175,0.4)]">
              {slides[currentSlide].illustration}
            </div>
            
            <div className="md:hidden">
              <h2 className="text-2xl font-bold text-dark mb-3 leading-tight">{slides[currentSlide].title}</h2>
              <p className="text-base text-muted max-w-[280px] mx-auto">{slides[currentSlide].sub}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Section (Desktop handles differently) */}
      <div className="px-6 pb-12 w-full flex flex-col items-center justify-center gap-8 md:h-screen md:bg-white md:px-16">
        
        <div className="hidden md:flex justify-end w-full absolute top-8 right-8">
          <button onClick={handleSkip} className="text-sm font-medium text-muted hover:text-dark px-4 py-2 rounded-full border border-sand">
            {t('skip')}
          </button>
        </div>

        <div className="hidden md:block text-center mb-8">
          <h2 className="text-4xl font-bold text-dark mb-4 leading-tight">{slides[currentSlide].title}</h2>
          <p className="text-lg text-muted max-w-[400px] mx-auto">{slides[currentSlide].sub}</p>
        </div>

        <div className="flex gap-2 mb-4">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-sand'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm">
          <Button size="full" onClick={handleNext} className="w-full shadow-active">
            {currentSlide === slides.length - 1 ? t('getStarted') : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  );
}
