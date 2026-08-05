import React from 'react';
import { TopBar } from '@/components/navigation/TopBar';
import { Header } from '@/components/navigation/Header';
import { CategoryNavBar } from '@/components/navigation/CategoryNavBar';
import { Footer } from '@/components/navigation/Footer';
import { BottomNav } from '@/components/shared/BottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CartContainer } from '@/components/cart/CartContainer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]" suppressHydrationWarning>
      <AuthGuard />
      
      {/* Top Announcement Bar */}
      <TopBar />

      {/* Main Brand & Search Navigation */}
      <Header />

      {/* Secondary Department / Category Bar */}
      <CategoryNavBar />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>

      {/* Full Marketplace Footer */}
      <Footer />

      {/* Floating Cart Drawer & Mobile Navigation */}
      <CartContainer />
      <BottomNav />
    </div>
  );
}
