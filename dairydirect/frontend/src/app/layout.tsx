import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted Inter variable font (single 48KB woff2 covering weights 100-900).
// Replaces the previous 7 separate static weights fetched from Google Fonts at
// build time: fewer requests, no third-party dependency, no build-time network call.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    template: `%s | ${BRAND.name}`,
    default: `${BRAND.name} — ${BRAND.tagline}`,
  },
  description: BRAND.shortDescription,
  keywords: [...BRAND.keywords],
  authors: [{ name: BRAND.name }],
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.promise,
    type: "website",
    url: BRAND.url,
    siteName: BRAND.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.promise,
  },
  icons: {
    icon: "/application logo/gjanand sarkar logo.png",
    apple: "/application logo/gjanand sarkar logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf3",
}

import { LanguageManager } from "@/components/shared/LanguageManager";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/constants/brand";

const orgStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": BRAND.name,
  "url": BRAND.url,
  "description": BRAND.longDescription,
  "logo": `${BRAND.url}/application%20logo/gjanand%20sarkar%20logo.png`,
  "areaServed": "IN",
  "sameAs": [BRAND.social.facebook, BRAND.social.instagram],
};

const webSiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": BRAND.name,
  "url": BRAND.url,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BRAND.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={orgStructuredData} />
        <JsonLd data={webSiteStructuredData} />
        <link rel="icon" href="/application logo/gjanand sarkar logo.png" type="image/png" />
      </head>
      <body
        className={`${inter.className} min-h-screen antialiased`}
        style={{ background: '#fafaf3', color: '#1a1c18' }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <LanguageManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
