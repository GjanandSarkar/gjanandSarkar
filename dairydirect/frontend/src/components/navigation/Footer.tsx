"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#082615] text-white pt-14 pb-8 border-t border-[#124227] relative overflow-hidden">
      
      {/* Decorative Peacock Watermark Background */}
      <div className="absolute right-0 bottom-0 w-96 h-96 opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
          <path d="M50 10 C65 25 80 45 70 70 C60 90 40 95 30 75 C20 55 35 25 50 10 Z" />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand & Bio (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            {/* ── Brand Logo ── */}
            <Link href="/home" className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform">
              <div className="relative flex items-center">
                <img
                  src="/application logo/gjanand sarkar logo.png"
                  alt="Gjanand Sarkar"
                  className="h-12 md:h-14 w-auto object-contain drop-shadow-xs brightness-110"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-black tracking-tight leading-none">
                    <span className="text-white">Gjanand</span>
                  </span>
                  <span className="text-[10px] md:text-[11px] tracking-[0.2em] font-black text-[#c88a23] uppercase text-right leading-none mt-0.5">
                    SARKAR
                  </span>
                </div>
              </div>
            </Link>

            <p className="text-xs text-emerald-100/80 leading-relaxed max-w-sm">
              Proudly Indian. Purely Authentic. Connecting conscious families directly with certified Vedic Gaushalas, traditional organic farmers, and regional artisans.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#c88a23] flex items-center justify-center text-white transition-colors cursor-pointer" 
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#c88a23] flex items-center justify-center text-white transition-colors cursor-pointer" 
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#c88a23] flex items-center justify-center text-white transition-colors cursor-pointer" 
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#c88a23] flex items-center justify-center text-white transition-colors cursor-pointer" 
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* X / Twitter */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#c88a23] flex items-center justify-center text-white transition-colors cursor-pointer" 
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/80">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQs & Help</Link></li>
              <li><Link href="/become-seller" className="hover:text-white transition-colors">Gaushala Partners</Link></li>
              <li><Link href="/about#fssai" className="hover:text-white transition-colors">FSSAI Verification</Link></li>
            </ul>
          </div>

          {/* Column 3: Help & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Help & Orders
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/80">
              <li><Link href="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/tracking" className="hover:text-white transition-colors">Delivery Timings (5:30 AM)</Link></li>
              <li><Link href="/subscribe" className="hover:text-white transition-colors">Manage Subscriptions</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Customer Care (24/7)</Link></li>
            </ul>
          </div>

          {/* Column 4: Sell on Gjanand Sarkar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Partnerships
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100/80">
              <li><Link href="/become-seller" className="hover:text-white transition-colors">Become a Seller</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-white transition-colors">Seller Portal Login</Link></li>
              <li><Link href="/become-seller" className="hover:text-white transition-colors">Farmer Guidelines</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Quality Standards</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Bulk & Corporate Supply</Link></li>
            </ul>
          </div>

          {/* Column 5: Newsletter & Subscribe */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Stay Connected
            </h4>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Get updates on fresh seasonal harvest, Vedic ghee batches, and festive offers.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 outline-none focus:border-[#c88a23]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#c88a23] hover:bg-[#b0781c] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{subscribed ? 'Subscribed!' : 'Subscribe'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-100/60">
          <div>
            © {new Date().getFullYear()} Gjanand Sarkar. All Rights Reserved.
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/about#fssai" className="hover:text-white transition-colors">FSSAI Certified</Link>
          </div>

          <div className="flex items-center gap-1 text-emerald-200">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span>in Bharat 🇮🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
