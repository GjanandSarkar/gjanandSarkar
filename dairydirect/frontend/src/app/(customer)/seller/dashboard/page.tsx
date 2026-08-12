"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink, 
  MessageCircle, 
  FileCheck2,
  X,
  UploadCloud,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSellerDashboard, SellerDashboardData } from '@/lib/api/sellers';
import { uploadImageToImageKit } from '@/lib/api/upload';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'payouts'>('overview');
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live store products
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    stock: number;
    status: string;
    rating: number;
    image_url?: string;
  }>>([]);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('A2 Dairy & Vedic Ghee');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('50');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      setData(null);
      return;
    }
    getSellerDashboard(user.id).then((res) => {
      setData(res);
      if (res.products && res.products.length > 0) {
        setProducts(res.products);
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    setIsSubmittingProd(true);

    try {
      const priceNum = parseFloat(newProdPrice);
      const stockNum = parseInt(newProdStock, 10) || 50;
      let finalImageUrl = '/milk.png';

      if (selectedFile) {
        try {
          const uploadRes = await uploadImageToImageKit(selectedFile, {
            category: newProdCategory,
            role: 'seller',
            entityType: 'product',
            entityId: user?.id,
          });
          if (uploadRes.url) {
            finalImageUrl = uploadRes.url;
          } else if (imagePreview) {
            finalImageUrl = imagePreview;
          }
        } catch (uploadErr) {
          console.warn('ImageKit upload fallback:', uploadErr);
          if (imagePreview) finalImageUrl = imagePreview;
        }
      } else if (imagePreview) {
        finalImageUrl = imagePreview;
      }

      const createdItem = {
        id: 'prod-' + Date.now(),
        name: newProdName.trim(),
        category: newProdCategory,
        price: priceNum,
        stock: stockNum,
        status: stockNum > 10 ? 'In Stock' : 'Low Stock',
        rating: 5.0,
        image_url: finalImageUrl,
      };

      setProducts((prev) => [createdItem, ...prev]);

      if (data) {
        setData({
          ...data,
          metrics: {
            ...data.metrics,
            totalProducts: (data.metrics.totalProducts || 0) + 1,
          },
        });
      }

      setIsAddModalOpen(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdStock('50');
      setSelectedFile(null);
      setImagePreview('');
    } finally {
      setIsSubmittingProd(false);
    }
  };


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

            {/* Verification Checklist */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto text-xs text-emerald-900">
              <h4 className="font-black uppercase tracking-wider flex items-center gap-1.5 text-[#0f3e26]">
                <FileCheck2 className="w-4 h-4 text-[#0f3e26]" />
                <span>Verification Checklist</span>
              </h4>
              <p>1. Our quality audit team verifies your FSSAI / cattle breed pedigree.</p>
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

  // ─── UNREGISTERED USER / NOT A SELLER YET ───
  if (!data?.store && !inquiry) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8 text-center">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center mx-auto border border-emerald-100">
              <Store className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                Seller Onboarding
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Partner with Gjanand Sarkar
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                Sell your pure Vedic A2 dairy, ghee, and authentic Indian products directly to conscious families nationwide.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/become-seller"
                className="w-full sm:w-auto px-7 py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Apply to Become a Seller
              </Link>
              <Link
                href="/home"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE SELLER DASHBOARD ───
  const storeName = (sellerStore as any)?.store_name || data?.store?.storeName || 'Seller Store';
  const storeState = sellerStore?.state || data?.store?.state || 'India';
  const storePlan = sellerStore?.plan || data?.store?.plan || 'Growth';
  const storeCommission = (sellerStore as any)?.commission_rate || data?.store?.commissionRate || 5;

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
              onClick={() => setIsAddModalOpen(true)}
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
            
            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  ₹{(data.metrics.grossRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real-time settled sales</span>
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
                  ₹{(data.metrics.platformCommission || 0).toLocaleString('en-IN')}
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
                  ₹{(data.metrics.netPayout || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-blue-600 font-bold mt-1">
                  Settled weekly via NEFT
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {products.length}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {data.metrics.pendingDeliveries || 0} orders processing
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
                  className="text-xs font-bold text-[#0f3e26] hover:underline cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              {data.recentOrders && data.recentOrders.length > 0 ? (
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
              ) : (
                <div className="py-8 text-center text-xs text-gray-500">
                  No orders recorded yet. New customer purchases will appear here live.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Store Order Management
            </h3>
            {data.recentOrders && data.recentOrders.length > 0 ? (
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
                      <button className="block text-[11px] font-bold text-[#0f3e26] hover:underline cursor-pointer">
                        Print Shipping Label
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No customer orders yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Customer orders for your catalog products will appear here with instant dispatch tracking.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Store Product Catalog ({products.length} Products)
                </h3>
                <p className="text-xs text-gray-500">Live catalog items and stock inventory</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#144f31] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-gray-200 hover:border-[#0f3e26] transition-colors bg-gray-50/50 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-full aspect-square bg-white rounded-xl p-2 mb-3 border border-gray-100 flex items-center justify-center overflow-hidden">
                        <img 
                          src={p.image_url || '/milk.png'} 
                          alt={p.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/milk.png'; }}
                        />
                      </div>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                        <span className="text-xs font-bold text-amber-600">★ {p.rating}</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{p.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{p.category || 'Vedic Dairy'}</p>
                      <p className="text-sm font-black text-[#0f3e26] mt-1.5">₹{p.price}</p>
                      <p className="text-[11px] text-gray-500">Stock: {p.stock} units</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <button 
                        onClick={() => alert(`Editing item ${p.name}`)}
                        className="flex-1 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Edit Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0f3e26] flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No products in your catalog yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Add your certified Vedic dairy, artisan craft or organic products to start receiving customer orders.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 hover:bg-[#144f31] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payouts */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Bank Payout & Settlement History
              </h3>
              <p className="text-xs text-gray-500">Automated NEFT settlements after deducting {storeCommission}% platform commission</p>
            </div>

            {data.payoutHistory && data.payoutHistory.length > 0 ? (
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
            ) : (
              <div className="text-center py-12 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No payout settlements recorded yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Your net revenue is calculated weekly after subtracting the {storeCommission}% platform fee.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Add Product Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-gray-900">Add New Product to Store</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Gir Cow Vedic Bilona Ghee (500ml)"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                  >
                    <option>A2 Dairy & Vedic Ghee</option>
                    <option>Cold-Pressed Oils</option>
                    <option>Artisanal Handicrafts</option>
                    <option>Vedic Ayurveda & Herbs</option>
                    <option>Organic Honey & Staples</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="e.g. 1450"
                    required
                    min="1"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stock Units</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  placeholder="50"
                  min="1"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Image (from device)</label>
                {imagePreview ? (
                  <div className="relative border border-emerald-200 bg-emerald-50/50 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {selectedFile?.name || 'Selected Image'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Ready to upload to ImageKit</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="border-2 border-dashed border-gray-300 hover:border-[#0f3e26] bg-gray-50/50 hover:bg-emerald-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-emerald-100 text-gray-500 group-hover:text-[#0f3e26] flex items-center justify-center transition-colors">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-800">
                        <span className="text-[#0f3e26] underline">Choose image from your device</span>
                      </p>
                      <p className="text-[10px] text-gray-400">JPG, PNG, WEBP, HEIC up to 5MB</p>
                    </label>
                  </div>
                )}
              </div>


              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="px-6 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingProd ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

