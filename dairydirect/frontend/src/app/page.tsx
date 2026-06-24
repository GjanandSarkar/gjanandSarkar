"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore(state => state.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/home');
        }
      } else {
        router.replace('/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [router, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream relative overflow-hidden bg-opacity-95">
      <div className="absolute bottom-[-10%] right-[-5%] w-64 h-64 bg-mint rounded-full blur-[100px] opacity-20 pointer-events-none" />
      
      <motion.div 
        className="flex flex-col items-center z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-20 h-20 bg-primary rounded-[20px] flex items-center justify-center mb-6 shadow-active text-white font-bold text-4xl">
          DD
        </div>
        
        <h1 className="text-3xl font-bold text-dark mb-2 tracking-tight">Gjanand Sarkar</h1>
        <p className="text-sm font-medium text-muted">{t('tagline')}</p>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <motion.div 
          className="w-32 h-[2px] bg-sand rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
