import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Heart, 
  Leaf, 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Truck, 
  Clock, 
  MapPin 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Gjanand Sarkar - India’s Purest Vedic Dairy & Artisanal Marketplace',
  description: 'Learn about Gjanand Sarkar, our sacred mission, certified A2 Gir cow gaushalas, lab-tested dairy purity, and fair-trade support for Indian farmers and artisans.',
};

export default function AboutPage() {
  const pillars = [
    {
      icon: Leaf,
      title: '100% Pure & Vedic Origin',
      desc: 'Sourced strictly from free-grazing indigenous Gir cows and organic farms. Zero chemicals, preservatives, hormones, or adulterants.'
    },
    {
      icon: Award,
      title: 'FSSAI & Lab Certified',
      desc: 'Every single batch undergoes 24+ rigorous laboratory tests including fat purity, SNF tests, aflatoxin screening, and antibiotic residue analysis.'
    },
    {
      icon: Truck,
      title: '4°C Cold-Chain Freshness',
      desc: 'Milked at dawn, chilled immediately, and delivered straight to your doorstep before 7:00 AM in insulated temperature-controlled vehicles.'
    },
    {
      icon: Heart,
      title: 'Fair-Trade Farmer Prosperity',
      desc: 'We bypass exploitative middlemen to pay up to 40% higher direct payouts to rural farmers, herders, and traditional craft clusters.'
    }
  ];

  const milestones = [
    {
      year: '2022',
      title: 'Humble Beginnings',
      desc: 'Started with 15 native Gir cows in Saurashtra, Gujarat, delivering pure Vedic A2 Bilona Ghee to conscious families.'
    },
    {
      year: '2023',
      title: 'Farm-to-Door Cold Chain',
      desc: 'Expanded direct farm fresh milk delivery across Ahmedabad & Gandhinagar with zero-contact 6:00 AM doorstep drops.'
    },
    {
      year: '2024',
      title: 'Multi-Category Expansion',
      desc: 'Introduced cold-pressed wood-churned oils, single-origin raw forest honey, stone-ground flours, and organic daily staples.'
    },
    {
      year: '2025+',
      title: 'Pan-India Artisanal Network',
      desc: 'Empowering 500+ verified rural Gaushalas, organic cooperatives, and self-help artisan groups serving 50,000+ happy households.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-900 pb-20">
      
      {/* Hero Banner */}
      <section className="relative bg-[#082615] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
            <path d="M50 10 C65 25 80 45 70 70 C60 90 40 95 30 75 C20 55 35 25 50 10 Z" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-[#c88a23]/40 text-[#c88a23] text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honoring Bharat's Sacred Agricultural Heritage</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Reclaiming Purity. <br className="hidden sm:block" />
            <span className="text-[#c88a23]">Direct From Gaushala To Home.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Gjanand Sarkar was founded on an unshakeable promise: To make authentic, unadulterated Vedic A2 dairy and natural pantry essentials accessible to every household while ensuring utmost respect for sacred cows and rural farmers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/home"
              className="px-6 py-3 rounded-xl bg-[#c88a23] hover:bg-[#b0781c] text-white font-extrabold text-sm transition-all shadow-md active:scale-95"
            >
              Explore Fresh Products
            </Link>
            <Link
              href="/become-seller"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-all"
            >
              Join As Farmer / Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Core Mission & Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Our Genesis</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f3e26] mt-2 mb-4">
              Why Gjanand Sarkar was born
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                In an era dominated by synthetic additives, ultra-processed packet milk, and chemical pesticides, pure nutrition has become rare. Millions of families drink milk from hormonally stimulated jersey cows without realizing its long-term digestive and immunological impact.
              </p>
              <p>
                We asked a simple question: <strong className="text-gray-900 font-semibold">What if our families could experience milk, ghee, and staples exactly as our ancestors did?</strong> Fresh, unaltered, rich in natural beta-casein A2 protein, ethically harvested after feeding calves their full share, and delivered within hours of sunrise.
              </p>
              <p>
                Today, Gjanand Sarkar bridges that sacred gap between conscious consumers and ethical Gaushalas across Gujarat, Rajasthan, and central Bharat.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f3e26] to-[#082615] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black text-amber-300">The GS Purity Standard</h3>
              <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-100">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Zero Antibiotics & Hormones:</strong> Natural herbal remedies and Ayurvedic care for all cows.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Traditional Vedic Bilona Churning:</strong> Ghee prepared from curd churned bi-directionally at sunrise.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Eco-friendly Glass Packaging:</strong> Clean, reusable glass bottles that preserve bioactive taste and nutrition.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Ahimsak & Compassionate:</strong> Calves feed first. Non-lactating elder cows protected for life.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="bg-emerald-50/60 py-16 border-y border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Our Pillars</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f3e26] mt-1">
              Built On Integrity & Science
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-emerald-200/70 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-[#0f3e26] flex items-center justify-center mb-4">
                  <pillar.icon className="w-6 h-6 text-[#0f3e26]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{pillar.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Growth & Impact</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f3e26] mt-1">
            Our Journey So Far
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {milestones.map((m, i) => (
            <div key={i} className="relative bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#0f3e26] text-white text-[11px] font-black tracking-wider mb-3">
                {m.year}
              </span>
              <h3 className="text-xs font-bold text-gray-900 mb-1">{m.title}</h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FSSAI & Quality Assurance Notice */}
      <section id="fssai" className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-8">
        <div className="bg-white border border-amber-300/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-[#c88a23] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1 flex items-center gap-2">
              <span>FSSAI License & Quality Certifications</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Verified</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Gjanand Sarkar operates under central Food Safety and Standards Authority of India (FSSAI) License No. <strong>10724026000189</strong>. All partner farms, processing centers, and cold logistics adhere strictly to FSSAI Schedule 4 hygiene standards.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
