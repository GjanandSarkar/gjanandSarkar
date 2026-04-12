import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DairyDirect — Farm to Door',
  description: 'Fresh dairy delivered daily from farm to your doorstep in Ahmedabad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#fafaf3' }}>
        {children}
      </body>
    </html>
  );
}
