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
  title: {
    template: "%s | Gjanand Sarkar",
    default: "Gjanand Sarkar — Farm Fresh Dairy, Delivered Daily",
  },
  description: "Premium A2 milk, artisanal paneer, and fresh dairy delivered from farm to your doorstep before sunrise. FSSAI certified. Gjanand Sarkar.",
  keywords: ["dairy delivery", "fresh milk", "A2 milk", "paneer", "farm fresh", "subscription"],
  authors: [{ name: "Gjanand Sarkar" }],
  appleWebApp: {
    capable: true,
    title: "Gjanand Sarkar",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Gjanand Sarkar — Farm Fresh Dairy",
    description: "A2 milk & artisanal dairy delivered fresh daily.",
    type: "website",
  },
  icons: {
    icon: "/application logo/gjanand sarkar logo.png",
    apple: "/application logo/gjanand sarkar logo.png",
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
import { JsonLd } from "@/components/seo/JsonLd";

const orgStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gjanand Sarkar",
  "url": "https://gjanandsarkar.com",
  "logo": "https://gjanandsarkar.com/application%20logo/gjanand%20sarkar%20logo.png",
  "sameAs": [
    "https://facebook.com/gjanandsarkar",
    "https://instagram.com/gjanandsarkar"
  ]
};

const webSiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gjanand Sarkar",
  "url": "https://gjanandsarkar.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gjanandsarkar.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={orgStructuredData} />
        <JsonLd data={webSiteStructuredData} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/application logo/gjanand sarkar logo.png" type="image/png" />
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
