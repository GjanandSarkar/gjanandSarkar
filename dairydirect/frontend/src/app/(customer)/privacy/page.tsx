import React from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Gjanand Sarkar',
  description: 'Learn how Gjanand Sarkar protects your personal information, delivery addresses, and payment security.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-gray-100 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#0f3e26] text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Security & Trust</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f3e26]">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Last Updated: August 2026 | Effective for all Gjanand Sarkar users
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs sm:text-sm leading-relaxed">
          
          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#c88a23]" />
              1. Information We Collect
            </h2>
            <p>
              When you use Gjanand Sarkar (our website, mobile applications, or subscription
              services), we collect information essential to fulfilling your orders:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Personal Identifiers:</strong> Name, phone number, email address, and delivery location/apartment details.</li>
              <li><strong>Order &amp; Subscription History:</strong> Products purchased, recurring delivery schedules, and delivery slot preferences.</li>
              <li><strong>Payment Information:</strong> Processed securely through RBI-licensed payment gateways (Razorpay). We do not store credit/debit card numbers or CVV on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#c88a23]" />
              2. How We Use Your Information
            </h2>
            <p>We utilize the collected information strictly for:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Fulfilling daily morning doorstep delivery routes between 5:30 AM and 7:30 AM.</li>
              <li>Sending automated WhatsApp/SMS order confirmations, dispatch alerts, and subscription renewal notices.</li>
              <li>Preventing fraudulent transactions and ensuring marketplace security.</li>
              <li>Continuously improving product quality, partner performance and app performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#c88a23]" />
              3. Data Protection & Sharing
            </h2>
            <p>
              We value your trust deeply. We <strong>NEVER sell or rent</strong> your personal information to third-party advertisers. Your information is shared only with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Authorized Delivery Executives:</strong> Exclusively for navigating to your registered doorstep address.</li>
              <li><strong>Payment Aggregators (Razorpay):</strong> For secure end-to-end tokenized transaction settlements.</li>
              <li><strong>Legal &amp; Regulatory Authorities:</strong> When strictly mandated by Indian law or applicable sector regulators.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#c88a23]" />
              4. Your Rights & Account Controls
            </h2>
            <p>
              You have the right to review, modify, or request deletion of your saved addresses, account details, and subscription history at any time. Simply visit your Profile settings or email us at <a href="mailto:care@gjanandsarkar.com" className="text-[#c88a23] font-bold hover:underline">care@gjanandsarkar.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <Link href="/terms" className="text-[#c88a23] font-bold hover:underline">
            Read Terms of Service →
          </Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            Have a question? Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}
