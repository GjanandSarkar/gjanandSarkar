import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted Manrope variable font (one woff2, weights 200-800).
//
// Manrope replaced Inter for the product-first rebuild: it is a little more
// geometric and open at 12-14 px, which is the size the catalogue actually
// lives at, and its numerals stay legible in dense price grids. Still one
// local file — no Google Fonts request, no layout-shifting third party.
const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
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
  themeColor: "#ffffff",
}

import { LanguageManager } from "@/components/shared/LanguageManager";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BRAND } from "@/lib/constants/brand";
import { AgentationDev } from "@/components/dev/AgentationDev";

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
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${manrope.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={orgStructuredData} />
        <JsonLd data={webSiteStructuredData} />
        <link rel="icon" href="/application logo/gjanand sarkar logo.png" type="image/png" />
        <script
          // Applied before first paint so dark-mode users never see a flash of
          // the cream theme. Must stay in sync with ThemeProvider's storage key.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gjanand-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${manrope.className} min-h-screen antialiased`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <LanguageManager />
            {children}
            <AgentationDev />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
