import React from 'react';
import { TopBar } from '@/components/navigation/TopBar';
import { Header } from '@/components/navigation/Header';
import { CategoryNavBar } from '@/components/navigation/CategoryNavBar';
import { Footer } from '@/components/navigation/Footer';
import { BottomNav } from '@/components/shared/BottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CartContainer } from '@/components/cart/CartContainer';
import { SupportChat } from '@/components/support/SupportChat';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-150" suppressHydrationWarning>
      <AuthGuard />
      
      {/* Top Announcement Bar */}
      <TopBar />

      {/* Main Brand & Search Navigation */}
      <Header />

      {/* Secondary Department / Category Bar */}
      <CategoryNavBar />

      {/* Main Content Area */}
      {/* Admin is capped at 1400px but the customer shell was not, so every
          page below stretched to the full width of the display. A generous cap
          leaves laptops unchanged and stops the content sprawling on wide
          monitors; individual pages narrow this further where it reads better. */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Full Marketplace Footer */}
      <Footer />

      {/* Floating Cart Drawer & Mobile Navigation */}
      <CartContainer />
      <BottomNav />

      {/* Scripted, order-aware help assistant */}
      <SupportChat />
    </div>
  );
}
