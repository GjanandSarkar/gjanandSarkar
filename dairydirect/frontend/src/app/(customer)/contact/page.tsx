"use client";

import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { validatePhoneNumber, formatPhoneInput } from '@/lib/utils/phone';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order Query',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validPhone = validatePhoneNumber(form.phone);
    if (!validPhone.isValid) {
      setError('Enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: 'Order Query', message: '' });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">We Are Here For You</span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3e26] mt-2 mb-3">
            Contact Customer Support
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Have questions about morning delivery timings, subscriptions, lab reports, or bulk farm orders? Our team is available 7 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Direct Support Channels */}
          <div className="space-y-4 lg:col-span-1">
            
            {/* WhatsApp Quick Support */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0f3e26] text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">WhatsApp Instant Support</h3>
                  <span className="text-[10px] text-emerald-700 font-semibold">Average reply under 5 mins</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Chat directly with our delivery operations desk for immediate slot adjustments or morning updates.
              </p>
              <a
                href="https://wa.me/919876543210?text=Hello%20Gjanand%20Sarkar%20Team%2C%20I%20have%20a%20query%20about%20my%20order."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Helpline Phone */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-[#c88a23] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Toll-Free Helpline</h3>
                  <p className="text-xs font-black text-[#0f3e26]">+91 1800-419-4567</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Operating Hours: 6:00 AM – 9:00 PM IST (Mon – Sun)
              </p>
            </div>

            {/* Email Contact */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Email Inquiries</h3>
                  <p className="text-xs font-bold text-gray-800">care@gjanandsarkar.com</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                For corporate gifting, bulk orders, or farm tie-ups.
              </p>
            </div>

            {/* Corporate Gaushala Hub */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Headquarters & Dairy Hub</h3>
                  <p className="text-[11px] text-gray-600">Gjanand Sarkar Dairy Direct LLP</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Kudasan Farm Road, Near Infocity Circle, Gandhinagar, Gujarat - 382421
              </p>
            </div>

          </div>

          {/* Contact & Inquiry Form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f3e26] mb-1">
              Send us a Message
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Fill in your details below and our customer success team will reach out within 2 hours.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0f3e26] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-[#0f3e26]">Message Received!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Thank you for contacting Gjanand Sarkar. Our support team will get back to you shortly at your registered contact.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-bold text-[#c88a23] hover:underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ananya Patel"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: formatPhoneInput(e.target.value) })}
                      placeholder="+919876543210"
                      maxLength={13}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="ananya@example.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                    >
                      <option value="Order Query">Order Status & Delivery</option>
                      <option value="Subscription">Daily Milk Subscription</option>
                      <option value="Quality">Lab Report & Purity Question</option>
                      <option value="Refund">Return & Refund Request</option>
                      <option value="Partnership">Farmer / Seller Onboarding</option>
                      <option value="Other">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Please mention your order ID or subscription details if applicable..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Sending...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Data encrypted & secure
              </span>
              <Link href="/faq" className="text-[#c88a23] font-bold hover:underline flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Check Frequently Asked Questions</span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
