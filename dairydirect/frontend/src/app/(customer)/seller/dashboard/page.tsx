"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Store, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink, 
  Edit, 
  Trash2,
  Phone,
  MessageCircle,
  AlertCircle,
  FileCheck2,
  Building2
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSellerDashboard, SellerDashboardData } from '@/lib/api/sellers';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'payouts'>('overview');
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sample store products
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Gir Cow Vedic Bilona Ghee (500ml)', price: 1450, stock: 45, status: 'In Stock', rating: 4.9 },
    { id: 'p2', name: 'A2 Vedic Cultured Butter (250g)', price: 420, stock: 18, status: 'Low Stock', rating: 4.8 },
    { id: 'p3', name: 'Raw Forest Wild Honey (500g)', price: 680, stock: 62, status: 'In Stock', rating: 4.7 },
    { id: 'p4', name: 'Handcrafted Kutch Bell Metal Lamp', price: 2890, stock: 8, status: 'Low Stock', rating: 5.0 },
  ]);

  useEffect(() => {
    getSellerDashboard(user?.id || 'demo-seller').then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, [user]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f3e26]" />
      </div>
    );
  }

  // Check if seller account is pending review or not active
  const isPendingReview = (sellerStore as any)?.status === 'pending_inquiry' || 
                          (data?.store as any)?.status === 'pending_review' || 
                          (data?.inquiry && data.inquiry.status !== 'approved');

  const inquiry = data?.inquiry;

  // ─── PENDING REVIEW / MANUAL VERIFICATION SCREEN ───
  if (isPendingReview && inquiry && inquiry.status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
          
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-[#c88a23] flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider">
                Application Under Manual Review
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                {inquiry.business_name || 'Your Seller Application'}
              </h1>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Thank you for applying to sell on Gjanand Sarkar. Our vendor onboarding manager is reviewing your farm/brand details and will contact you manually via Call/WhatsApp.
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-200 space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Inquiry ID:</span>
                <span className="font-mono font-bold text-gray-900">{inquiry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Contact Person:</span>
                <span className="font-bold text-gray-900">{inquiry.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Contact Number:</span>
                <span className="font-bold text-gray-900">+91 {inquiry.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Product Category:</span>
                <span className="font-bold text-[#0f3e26]">{inquiry.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {inquiry.status === 'contacted' ? 'Contacted & Sampling' : 'Pending Verification'}
                </span>
              </div>
            </div>

            {/* What to expect next */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto text-xs text-emerald-900">
              <h4 className="font-black uppercase tracking-wider flex items-center gap-1.5 text-[#0f3e26]">
                <FileCheck2 className="w-4 h-4 text-[#0f3e26]" />
                <span>Verification Checklist</span>
              </h4>
              <p>1. Our quality audit team will verify your FSSAI / cattle breed pedigree.</p>
              <p>2. We arrange a sample quality check or lab purity certificate review.</p>
              <p>3. Once approved, your seller dashboard & storefront go live instantly.</p>
            </div>

            {/* Quick Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/919825123456?text=${encodeURIComponent(`Hello Gjanand Sarkar team, checking status on my seller inquiry (ID: ${inquiry.id}) for ${inquiry.business_name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Onboarding Team</span>
              </a>
              <Link
                href="/home"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ─── ACTIVE SELLER DASHBOARD ───
  const storeName = (sellerStore as any)?.store_name || (data?.store as any)?.storeName || 'Gir Organic & Vedic Dairy';
  const storeState = sellerStore?.state || (data?.store as any)?.state || 'Gujarat';
  const storePlan = sellerStore?.plan || (data?.store as any)?.plan || 'Growth';
  const storeCommission = (sellerStore as any)?.commission_rate || (data?.store as any)?.commissionRate || 5;

  return (
    <div className="min-h-screen bg-[#fafaf8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Banner & Store Header */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3e26] text-white flex items-center justify-center font-black text-2xl shadow-md border border-[#c88a23]/40 shrink-0">
              <Store className="w-8 h-8 text-[#c88a23]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0f3e26] tracking-tight">
                  {storeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified GI Seller</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                State Origin: <strong className="text-gray-800">{storeState}</strong> • Plan: <span className="capitalize font-bold text-[#c88a23]">{storePlan} Tier ({storeCommission}% Platform Fee)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setActiveTab('products')}
              className="px-4 py-2 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Financial Overview & KPIs' },
            { id: 'orders', label: 'Recent Orders' },
            { id: 'products', label: 'Product Catalog & Inventory' },
            { id: 'payouts', label: 'Payout Settlements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#0f3e26] text-[#0f3e26]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* SaaS Metrics 4-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  ₹{(data.metrics.grossRevenue || 284500).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% this month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#c88a23] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-700">
                  ₹{(data.metrics.platformCommission || 14225).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {storeCommission}% rate on {storePlan} tier
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Net Payout to Bank</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#0f3e26]">
                  ₹{(data.metrics.netPayout || 270275).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-blue-600 font-bold mt-1">
                  Settled weekly every Tuesday
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {data.metrics.totalOrders || 342}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {data.metrics.pendingDeliveries || 8} dispatching today
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Recent Customer Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#0f3e26] hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-800">{order.id}</span>
                      <p className="text-xs text-gray-500">{order.customerName} • {order.itemsCount} items</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900">₹{order.amount}</span>
                      <p className="text-[11px] text-emerald-600 capitalize font-semibold">{order.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Store Order Management
            </h3>
            <div className="divide-y divide-gray-100">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#0f3e26]">{order.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{order.customerName} • {order.itemsCount} products ordered</p>
                    <span className="text-[10px] text-gray-400">{order.date}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-sm font-black text-gray-900">₹{order.amount}</span>
                    <button className="block text-[11px] font-bold text-[#0f3e26] hover:underline">
                      Print Shipping Label
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Store Product Catalog
                </h3>
                <p className="text-xs text-gray-500">Manage active items, pricing, and batch stock levels</p>
              </div>
              <button 
                onClick={() => alert('New product creation form initialized!')}
                className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#144f31] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-gray-200 hover:border-[#0f3e26] transition-colors bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      p.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-amber-600">★ {p.rating}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{p.name}</h4>
                    <p className="text-sm font-black text-[#0f3e26] mt-1">₹{p.price}</p>
                    <p className="text-[11px] text-gray-500">Stock: {p.stock} units</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <button className="flex-1 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Payouts */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Bank Payout & Settlement History
              </h3>
              <p className="text-xs text-gray-500">Automated NEFT settlements after deducting SaaS commission</p>
            </div>

            <div className="divide-y divide-gray-100">
              {data.payoutHistory.map((payout) => (
                <div key={payout.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-gray-900">{payout.id}</span>
                    <p className="text-xs text-gray-500">Direct Deposit (NEFT) • {payout.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">₹{payout.net.toLocaleString('en-IN')}</span>
                    <p className="text-[10px] text-gray-400">Platform fee deducted: ₹{payout.fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
