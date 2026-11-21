import React from 'react';
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
<<<<<<< HEAD
    <div className="flex flex-col min-h-screen bg-background" suppressHydrationWarning>
      <AuthGuard />
      
      {/* Main Brand & Search Navigation */}
=======
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-150" suppressHydrationWarning>
      <AuthGuard />

      {/* Top Announcement Bar (32px Saffron strip) */}
      <TopBar />

      {/* Main Brand & Search Navigation (Modular 104px mobile / 72px desktop) */}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      <Header />

      {/* Secondary Department / Category Bar */}
      <CategoryNavBar />

<<<<<<< HEAD
      {/* Main Content Area */}
      {/* Admin is capped at 1400px but the customer shell was not, so every
          page below stretched to the full width of the display. A generous cap
          leaves laptops unchanged and stops the content sprawling on wide
          monitors; individual pages narrow this further where it reads better. */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto pb-bottom-stack">
=======
      {/* Main Content Area: Responsive container with mobile cart bottom clearance */}
      <main className="flex-1 w-full max-w-[var(--w-content)] mx-auto px-0 md:px-6 pb-[calc(var(--h-bottomnav)+64px)] md:pb-8">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
