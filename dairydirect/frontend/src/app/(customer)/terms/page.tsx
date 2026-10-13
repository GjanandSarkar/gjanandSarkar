import React from 'react';
import { Metadata } from 'next';
import { Scale, CheckCircle2, ShieldAlert, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Gjanand Sarkar',
  description: 'Terms and Conditions governing purchases, subscriptions, deliveries, and refunds on Gjanand Sarkar.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-gray-100 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-[#c88a23] text-xs font-bold uppercase tracking-wider mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal & Marketplace Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f3e26]">
            Terms of Service
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Effective Date: August 2026 | Governing all marketplace orders and subscriptions
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs sm:text-sm leading-relaxed">
          
          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#c88a23]" />
              1. Platform Services & Eligibility
            </h2>
            <p>
              Gjanand Sarkar operates a curated marketplace for products made in India,
              partnering with one verified company per product category. By accessing or
              ordering from our platform, you confirm that you are at least 18 years of age
              and legally competent to enter into binding agreements under Indian law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#c88a23]" />
              2. Deliveries, Slots & Cold Chain
            </h2>
            <p>
              Delivery windows vary by category and destination pincode and are shown at
              checkout. For perishable categories such as dairy and fresh produce:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Customers must ensure accessible doorstep delivery or gate access for the delivery executive.</li>
              <li>Glass bottles are collected or exchanged during subsequent deliveries. Customers are encouraged to rinse and return empty bottles.</li>
              <li>Subscription modifications (pause/resume/quantity changes) must be made before 8:00 PM for next-day dispatch.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#c88a23]" />
              3. Pricing, Payments & Refunds
            </h2>
            <p>
              All prices are listed in Indian Rupees (₹) and include applicable GST. Payments are securely processed via Razorpay. In the event of:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Damaged or Broken Items:</strong> 100% instant refund or replacement provided upon reporting via our Returns portal within 24 hours of delivery.</li>
              <li><strong>Missed Delivery:</strong> Full credit refunded to your account wallet or payment source immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f3e26] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#c88a23]" />
              4. Quality & Purity Assurance
            </h2>
            <p>
              Food and beverage categories are sold under valid FSSAI licensing and are
              batch-tested by the partner brand. Customers with allergies or specific dietary
              sensitivities should read the product label and consult their healthcare
              provider before consumption.
            </p>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <Link href="/privacy" className="text-[#c88a23] font-bold hover:underline">
            ← Read Privacy Policy
          </Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            Questions? Contact Legal / Support Desk
          </Link>
        </div>

      </div>
    </div>
  );
}
