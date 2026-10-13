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

  const categories = ['All', 'About the Platform', 'Orders & Delivery', 'Subscriptions', 'Payments & Refunds'];

  const faqs: FAQItem[] = [
    {
      category: 'About the Platform',
      question: 'What is Gjanand Sarkar?',
      answer: 'Gjanand Sarkar is a curated marketplace for products made in India. We bring trusted Indian brands onto one platform across dairy, groceries, spices, wellness, home, fashion, electronics and more.'
    },
    {
      category: 'About the Platform',
      question: 'Why is there only one brand per category?',
      answer: 'We partner with exactly one verified company in each category. Instead of scrolling through dozens of near-identical listings and guessing which seller is genuine, you get one brand we have vetted and taken responsibility for. It is the core of how we work.'
    },
    {
      category: 'About the Platform',
      question: 'How do you verify a partner brand?',
      answer: 'Every partner is checked for business registration, GST and applicable category licences before they can list. Food and wellness partners additionally hold the certifications required for their category. Partners remain active only while they meet those standards.'
    },
    {
      category: 'Orders & Delivery',
      question: 'Where do you deliver?',
      answer: 'We deliver across India. Enter your pincode at checkout to see the delivery window and charges for your address.'
    },
    {
      category: 'Orders & Delivery',
      question: 'Can I order from multiple categories in one basket?',
      answer: 'Yes. You can mix products from any categories in a single order. Items may ship from different partner warehouses, so parts of your order can arrive separately \u2014 you can track each shipment from the Orders page.'
    },
    {
      category: 'Orders & Delivery',
      question: 'How do I track my order?',
      answer: 'Open the Orders tab in your profile to see live status for every shipment, along with the expected delivery date and courier details.'
    },
    {
      category: 'Subscriptions',
      question: 'Which products can I subscribe to?',
      answer: 'Repeat-purchase essentials \u2014 such as dairy, groceries and household staples \u2014 support scheduled delivery. Look for the Subscribe option on the product page.'
    },
    {
      category: 'Subscriptions',
      question: 'Can I pause or change a subscription?',
      answer: 'Yes. Pause, resume or change quantity anytime from the Subscriptions tab in your profile. There is zero lock-in and you can cancel in one click.'
    },
    {
      category: 'Payments & Refunds',
      question: 'Which payment methods are accepted?',
      answer: 'We support all major payment modes via Razorpay including UPI (Google Pay, PhonePe, Paytm), credit and debit cards, net banking and wallets.'
    },
    {
      category: 'Payments & Refunds',
      question: 'What if an item arrives damaged or never arrives?',
      answer: 'Report it from the Returns & Refunds page and we will arrange a replacement or refund. Because each category has a single accountable partner, we resolve the issue directly rather than leaving you to chase a seller.'
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
            Everything you need to know about ordering, delivery, subscriptions
            and how we pick our partner brands.
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
              Our customer success team is here to help with order changes, returns
              or any other question.
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
