import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DairyDirect — Farm Fresh Dairy, Delivered Daily",
  description: "Premium A2 milk, artisanal paneer, and fresh dairy delivered from farm to your doorstep before sunrise. FSSAI certified. DairyDirect.",
  keywords: ["dairy delivery", "fresh milk", "A2 milk", "paneer", "farm fresh", "subscription"],
  authors: [{ name: "DairyDirect" }],
  appleWebApp: {
    capable: true,
    title: "DairyDirect",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "DairyDirect — Farm Fresh Dairy",
    description: "A2 milk & artisanal dairy delivered fresh daily.",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fafaf3",
}

import { LanguageManager } from "@/components/shared/LanguageManager";
import { AuthProvider } from "@/components/shared/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased" 
        style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fafaf3', color: '#1a1c18' }} suppressHydrationWarning>
        <AuthProvider>
          <LanguageManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
