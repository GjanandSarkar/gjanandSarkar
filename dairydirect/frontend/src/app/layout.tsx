import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";

<<<<<<< HEAD
// Self-hosted Manrope variable font (one woff2, weights 200-800).
//
// Manrope replaced Inter for the product-first rebuild: it is a little more
// geometric and open at 12-14 px, which is the size the catalogue actually
// lives at, and its numerals stay legible in dense price grids. Still one
// local file — no Google Fonts request, no layout-shifting third party.
const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
=======
const ui = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-ui",
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
  weight: "100 900",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial", // kills CLS on swap
});

const display = localFont({
  src: "../fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
});

// Lazy: English users never download these
const devanagari = localFont({
  src: "../fonts/noto-sans-devanagari-devanagari-wght-normal.woff2",
  variable: "--font-devanagari",
  weight: "100 900",
  display: "swap",
  preload: false,
});

const gujarati = localFont({
  src: "../fonts/noto-sans-gujarati-gujarati-wght-normal.woff2",
  variable: "--font-gujarati",
  weight: "100 900",
  display: "swap",
  preload: false,
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
<<<<<<< HEAD
  themeColor: "#ffffff",
}
=======
  themeColor: "#FFFBF5",
};
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

import { LanguageManager } from "@/components/shared/LanguageManager";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BRAND } from "@/lib/constants/brand";
<<<<<<< HEAD
import { AgentationDev } from "@/components/dev/AgentationDev";
=======
import { AgentationDevTool } from "@/components/dev/AgentationDevTool";
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  return (
<<<<<<< HEAD
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${manrope.variable}`} suppressHydrationWarning>
=======
    <html
      lang={locale}
      data-locale={locale}
      data-scroll-behavior="smooth"
      className={`${ui.variable} ${display.variable} ${devanagari.variable} ${gujarati.variable}`}
      suppressHydrationWarning
    >
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gjanand-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
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
<<<<<<< HEAD
        className={`${manrope.className} min-h-screen antialiased`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
=======
        className="min-h-screen antialiased bg-background text-foreground transition-colors duration-150"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <LanguageManager />
            {children}
<<<<<<< HEAD
            <AgentationDev />
=======
            <AgentationDevTool />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
