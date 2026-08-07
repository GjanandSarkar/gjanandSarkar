"use client";

import React, { useState } from 'react';
import { 
  ChevronDown, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard,
  PhoneCall
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = ['All', 'Delivery & Timing', 'A2 Purity & Quality', 'Subscriptions', 'Payments & Refunds'];

  const faqs: FAQItem[] = [
    {
      category: 'Delivery & Timing',
      question: 'What time does the morning milk delivery arrive?',
      answer: 'Our dedicated cold-chain delivery fleet delivers daily between 5:30 AM and 7:30 AM directly to your door in insulated carrier crates, ensuring you have fresh milk before morning tea or breakfast.'
    },
    {
      category: 'Delivery & Timing',
      question: 'Do you deliver in glass bottles or pouches?',
      answer: 'All our fresh milk and Vedic ghee is bottled in sanitized, reusable food-grade glass bottles to prevent microplastic leeching and preserve the rich natural flavor.'
    },
    {
      category: 'A2 Purity & Quality',
      question: 'What makes Gjanand Sarkar A2 Gir Cow Milk special?',
      answer: 'Our milk is exclusively obtained from indigenous Bos Indicus (Gir, Kankrej, and Sahiwal) cows grazing on open pastures with organic fodder. It contains 100% natural A2 beta-casein protein which is easily digestible and free from the inflammatory A1 mutant proteins found in hybrid/jersey cow milk.'
    },
    {
      category: 'A2 Purity & Quality',
      question: 'How do you ensure zero adulteration?',
      answer: 'Every morning batch is tested for 24 distinct parameters including fat percentage, solid-not-fat (SNF), microbial load, water dilution, urea, maltodextrin, antibiotics, and detergent traces before leaving the farm gate.'
    },
    {
      category: 'Subscriptions',
      question: 'How do I pause or modify my daily milk subscription when I go out of town?',
      answer: 'You can pause, resume, or change your daily quantity anytime via the "Subscriptions" tab in your profile before 8:00 PM for the next morning’s delivery without any penalty.'
    },
    {
      category: 'Subscriptions',
      question: 'Is there a minimum lock-in period for subscriptions?',
      answer: 'No! There is zero lock-in period. You can choose daily, alternate day, or custom schedule delivery and cancel anytime with 1 click.'
    },
    {
      category: 'Payments & Refunds',
      question: 'Which payment methods are accepted?',
      answer: 'We support all major payment modes via Razorpay including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallet balances.'
    },
    {
      category: 'Payments & Refunds',
      question: 'What is your refund policy for broken glass or missed delivery?',
      answer: 'We have a 100% "No Questions Asked" replacement or instant refund guarantee. If a bottle is damaged or missing, simply report it on the Returns & Refunds page and the amount is immediately credited back to your wallet or original payment method.'
    }
  ];

  const filteredFaqs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-[#0f3e26] text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Customer Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3e26] tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Gjanand Sarkar’s Vedic products, cold-chain delivery slots, subscriptions, and purity standards.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0f3e26] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#c88a23]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-[13px] text-gray-600 leading-relaxed border-t border-gray-100 bg-[#fdfdfc]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-12 bg-gradient-to-r from-[#0f3e26] to-[#175c3a] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-lg font-black text-amber-300 mb-1">
              Still have questions?
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-md">
              Our customer success team is here to assist you with order modifications, Gaushala visits, or custom inquiries.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 bg-[#c88a23] hover:bg-[#b0781c] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Support</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
