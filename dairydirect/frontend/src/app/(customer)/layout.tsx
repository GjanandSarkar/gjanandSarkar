import React from 'react';
import { TopBar } from '@/components/navigation/TopBar';
import { Header } from '@/components/navigation/Header';
import { CategoryNavBar } from '@/components/navigation/CategoryNavBar';
import { Footer } from '@/components/navigation/Footer';
import { BottomNav } from '@/components/shared/BottomNav';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CartContainer } from '@/components/cart/CartContainer';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { SupportChat } from '@/components/support/SupportChat';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-150" suppressHydrationWarning>
      <AuthGuard />

      {/* Top Announcement Bar (32px Saffron strip) */}
      <TopBar />

      {/* Main Brand & Search Navigation (Modular 104px mobile / 72px desktop) */}
      <Header />

      {/* Secondary Department / Category Bar */}
      <CategoryNavBar />

      {/* Main Content Area: Responsive container with mobile cart bottom clearance */}
      <main className="flex-1 w-full max-w-[var(--w-content)] mx-auto px-0 md:px-6 pb-[calc(var(--h-bottomnav)+64px)] md:pb-8">
        {children}
      </main>

      {/* Full Marketplace Footer */}
      <Footer />

      {/* Floating Cart Drawer, Sticky Mobile Cart Bar, Notifications & Mobile Navigation */}
      <CartContainer />
      <StickyCartBar />
      <NotificationDrawer />
      <BottomNav />

      {/* Scripted, order-aware help assistant */}
      <SupportChat />
    </div>
  );
}
