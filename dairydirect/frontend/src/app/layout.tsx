import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";

const ui = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-ui",
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
  themeColor: "#FFFBF5",
};

import { LanguageManager } from "@/components/shared/LanguageManager";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { BRAND } from "@/lib/constants/brand";
import { AgentationDevTool } from "@/components/dev/AgentationDevTool";

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
    <html
      lang={locale}
      data-locale={locale}
      data-scroll-behavior="smooth"
      className={`${ui.variable} ${display.variable} ${devanagari.variable} ${gujarati.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gjanand-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <JsonLd data={orgStructuredData} />
        <JsonLd data={webSiteStructuredData} />
        <link rel="icon" href="/application logo/gjanand sarkar logo.png" type="image/png" />
      </head>
      <body
        className="min-h-screen antialiased bg-background text-foreground transition-colors duration-150"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <LanguageManager />
            {children}
            <AgentationDevTool />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
