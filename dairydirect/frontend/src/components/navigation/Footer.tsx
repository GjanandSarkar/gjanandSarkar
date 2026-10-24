"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronDown } from 'lucide-react';

/**
 * Site footer.
 *
 * Deliberately small. It previously carried four link columns, a newsletter
 * signup that was never wired to a mailing provider (so it collected
 * nothing), and a long brand blurb -- several screens of scrolling on a
 * phone, below content people had already finished reading.
 *
 * It is now two columns, which collapse into accordions below md so the
 * footer costs only a couple of lines of height on mobile. The
 * seller/partner links were folded into Company rather than dropped.
 */

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { label: 'Facebook', href: 'https://facebook.com', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { label: 'YouTube', href: 'https://youtube.com', d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { label: 'LinkedIn', href: 'https://linkedin.com', d: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
  { label: 'X', href: 'https://twitter.com', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' }
];

const COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Partner With Us', href: '/become-seller' },
      { label: 'Seller Portal', href: '/seller/dashboard' },
      { label: 'Brand Verification', href: '/about#verification' },
    ],
  },
  {
    title: 'Help & Orders',
    links: [
      { label: 'Track Orders', href: '/orders' },
      { label: 'Returns & Refunds', href: '/returns' },
      { label: 'Manage Subscriptions', href: '/subscribe' },
      { label: 'FAQs & Help', href: '/faq' },
      { label: 'Customer Care', href: '/contact' },
    ],
  },
];

export function Footer() {
  // Mobile only: which accordion is open. Both render open from md up.
  const [openColumn, setOpenColumn] = useState<string | null>(null);

  return (
    <footer className="w-full bg-surface-muted text-foreground pt-10 pb-6 border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 pb-6 md:pb-8 border-b border-border">

          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/home" className="flex items-center gap-2 w-fit active:scale-95 transition-transform">
              <img
                src="/application logo/gjanand sarkar logo.png"
                alt=""
                aria-hidden="true"
                className="h-10 w-auto object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="flex flex-col">
                <span className="text-xl font-black tracking-tight leading-none text-foreground">Gjanand</span>
                <span className="text-[10px] tracking-[0.2em] font-black text-secondary uppercase text-right leading-none mt-0.5">
                  SARKAR
                </span>
              </span>
            </Link>

            <p className="text-xs text-foreground-muted leading-relaxed max-w-xs">
              One verified partner brand per category. Proudly Indian.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-primary/10 hover:bg-secondary flex items-center justify-center text-foreground hover:text-on-secondary transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns: accordions on mobile, plain lists from md up. */}
          {COLUMNS.map((col) => {
            const isOpen = openColumn === col.title;
            return (
              <div key={col.title} className="border-b border-border md:border-0">
                <button
                  type="button"
                  onClick={() => setOpenColumn(isOpen ? null : col.title)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between py-3 md:py-0 md:pb-3 md:cursor-default text-xs font-bold uppercase tracking-wider text-secondary"
                >
                  <span>{col.title}</span>
                  <ChevronDown
                    className={`w-4 h-4 md:hidden transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <ul className={`${isOpen ? 'block' : 'hidden'} md:block space-y-2 text-xs text-foreground-muted pb-3 md:pb-0`}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-primary transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Legal strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-foreground-muted">
          <div>© {new Date().getFullYear()} Gjanand Sarkar. All Rights Reserved.</div>

          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span aria-hidden="true">•</span>
            <Link href="/about#verification" className="hover:text-primary transition-colors">Verified Partners</Link>
          </div>

          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 fill-error text-error" aria-hidden="true" />
            <span>in Bharat 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
