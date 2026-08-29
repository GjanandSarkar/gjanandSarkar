"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Award,
  Loader2,
  Store,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  Copy,
  MessageCircle
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { submitSellerInquiry, SellerInquiry } from '@/lib/api/sellers';
import { validatePhoneNumber, formatPhoneInput } from '@/lib/utils/phone';

export default function BecomeSellerPage() {
  const user = useStore((s) => s.user);

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [stateOrigin, setStateOrigin] = useState('Gujarat');
  const [category, setCategory] = useState('A2 Dairy & Vedic Ghee');
  const [productRange, setProductRange] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('500 - 1,000 Liters / Units');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  // Status & Submission
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState<SellerInquiry | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const statesList = [
    'Gujarat', 'Rajasthan', 'Punjab', 'Maharashtra', 'Kerala', 
    'Tamil Nadu', 'Kashmir', 'Himachal Pradesh', 'West Bengal', 'Karnataka', 'Madhya Pradesh', 'Uttar Pradesh'
  ];

  const categoriesList = [
    'A2 Dairy & Vedic Ghee',
    'Vedic Ayurveda & Herbs',
    'Artisanal Handicrafts & Handloom',
    'Cold-Pressed Wood Churned Oils',
    'Heritage Spices & Seasonings',
    'Organic Staples, Pulses & Grains',
    'Pooja & Spiritual Essentials',
    'Traditional Indian Sweets & Snacks'
  ];

  const volumeOptions = [
    'Under 200 Liters / Units per month',
    '200 - 500 Liters / Units per month',
    '500 - 1,000 Liters / Units per month',
    '1,000 - 5,000 Liters / Units per month',
    '5,000+ Liters / Units per month (Commercial Scale)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your farm, brand, or business name');
      return;
    }
    const validPhone = validatePhoneNumber(phone);
    if (!validPhone.isValid) {
      setError('Enter a valid Indian mobile number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitSellerInquiry({
        userId: user?.id,
        fullName,
        businessName,
        phone,
        email,
        city,
        state: stateOrigin,
        category,
        productRange,
        monthlyVolume,
        fssaiNumber,
        gstin,
        notes
      });

      if (res.success && res.inquiry) {
        setSubmittedInquiry(res.inquiry);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (submittedInquiry?.id) {
      navigator.clipboard.writeText(submittedInquiry.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Top Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f3e26]/10 border border-[#0f3e26]/20 text-[#0f3e26] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#c88a23]" />
            <span>Direct-from-Source Vendor Partnership</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f3e26] tracking-tight leading-tight">
            Become a Verified Seller on Gjanand Sarkar
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            We partner with certified Indian dairy farmers, traditional Bilona ghee makers, and heritage artisans. 
            Submit your seller inquiry below — our vendor onboarding team will contact you manually within 24-48 hours to verify quality and onboard your store.
          </p>
        </div>

        {/* 3-Step Manual Onboarding Workflow Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0f3e26] flex items-center justify-center font-black text-sm mb-3">
              01
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Submit Seller Inquiry</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Fill out your farm, dairy brand, or artisanal workshop details along with your production capacity.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c88a23]/30 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#c88a23] flex items-center justify-center font-black text-sm mb-3">
              02
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Manual Quality Verification</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Our team will call / WhatsApp you within 24-48h to review FSSAI, purity lab tests, and sample quality.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm mb-3">
              03
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Store Launch & Pan-India Sales</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Once approved, your brand storefront is activated with integrated nationwide cold-chain delivery.
            </p>
          </div>
        </div>

        {/* Success Confirmation Modal / Screen */}
        {submittedInquiry ? (
          <div className="bg-white rounded-3xl border-2 border-emerald-500/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0f3e26] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
                Inquiry Submitted Successfully
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                Thank You, {submittedInquiry.full_name}!
              </h2>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                We have received the seller application for <strong className="text-gray-900">{submittedInquiry.business_name}</strong>.
              </p>
            </div>

            {/* Reference Badge */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-4 max-w-md mx-auto">
              <div className="text-left">
                <p className="text-[10px] uppercase font-black text-gray-400">Inquiry Reference ID</p>
                <p className="text-base font-black text-[#0f3e26] font-mono">{submittedInquiry.id}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>

            {/* Next Steps Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-left space-y-3">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c88a23]" />
                <span>What Happens Next?</span>
              </h4>
              <ul className="text-xs text-amber-900 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#c88a23]">•</span>
                  <span>Our Onboarding Manager will call / WhatsApp you at <strong>+91 {submittedInquiry.phone}</strong> within <strong>24 to 48 business hours</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#c88a23]">•</span>
                  <span>We will verify your FSSAI credentials, batch quality certificates, and discuss packaging standards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#c88a23]">•</span>
                  <span>Upon approval, your seller dashboard will be unlocked with automated inventory & payout tools.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/919825123456?text=${encodeURIComponent(`Hello Gjanand Sarkar team, I have submitted a seller inquiry (ID: ${submittedInquiry.id}) for ${submittedInquiry.business_name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Quick WhatsApp Verification</span>
              </a>
              <Link
                href="/home"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                Return to Marketplace
              </Link>
            </div>
          </div>
        ) : (
          /* Main Inquiry Submission Form */
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Section 1: Contact Information */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Phone className="w-4 h-4 text-[#c88a23]" />
                  <span>1. Contact & Owner Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Full Name / Owner Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bhavesh Bhai Patel"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone.replace(/^\+91/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(`+91${digits}`);
                        }}
                        placeholder="9825012345"
                        maxLength={10}
                        className="w-full px-4 py-2.5 rounded-r-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Our verification team will call or message this number.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@girfarm.in"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Farm / Brand / Business Profile */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building2 className="w-4 h-4 text-[#c88a23]" />
                  <span>2. Farm & Brand Credentials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Brand / Farm / Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Gir Amrutam Vedic Farm & Dairy"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      State Origin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={stateOrigin}
                      onChange={(e) => setStateOrigin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {statesList.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      City / District / Village
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Junagadh / Kutch"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Primary Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Estimated Monthly Capacity / Production
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {volumeOptions.map((vol) => (
                        <option key={vol} value={vol}>{vol}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Product Specialties & Product Range
                    </label>
                    <input
                      type="text"
                      value={productRange}
                      onChange={(e) => setProductRange(e.target.value)}
                      placeholder="e.g. Vedic A2 Gir Cow Bilona Ghee, Cultured White Butter, Cold-pressed Sesame Oil"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Purity & Quality Standards */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Award className="w-4 h-4 text-[#c88a23]" />
                  <span>3. Quality Verification & Licenses</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      FSSAI License Number (Optional/Recommended)
                    </label>
                    <input
                      type="text"
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value)}
                      placeholder="14-digit FSSAI Number"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="15-digit GSTIN"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none uppercase font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Describe Your Purity, Cattle Breed, or Crafting Process
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us about your cattle breed (Gir/Kankrej), fodder practices, traditional clay pot churning, or artisanal handloom methods..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-gray-500 max-w-md text-center sm:text-left">
                  By submitting this inquiry, you agree to undergo our quality audit and adhere to Gjanand Sarkar 100% Purity Guidelines.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Seller Inquiry</span>
                      <ArrowRight className="w-4 h-4 text-[#c88a23]" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <ShieldCheck className="w-6 h-6 text-[#0f3e26] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Purity Verified Seal</h4>
            <p className="text-[11px] text-gray-500">Every batch is certified so conscious customers buy with full trust.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Truck className="w-6 h-6 text-[#c88a23] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Cold-Chain Logistics</h4>
            <p className="text-[11px] text-gray-500">Temperature-controlled pan-India shipping handled end-to-end.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Store className="w-6 h-6 text-[#0f3e26] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Direct Brand Store</h4>
            <p className="text-[11px] text-gray-500">Dedicated storefront with full brand identity and storytelling.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Award className="w-6 h-6 text-[#c88a23] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Weekly Payouts</h4>
            <p className="text-[11px] text-gray-500">Direct-to-bank settlement every 7 days with lowest SaaS commission.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
