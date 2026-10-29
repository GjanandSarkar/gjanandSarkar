import React from 'react';
import { notFound } from 'next/navigation';
import { getProductsServer } from '@/lib/api/products.server';
import { ProductCard } from '@/components/shared/ProductCard';

export const dynamic = 'force-dynamic';

async function getSellerDetails(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sellers/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.seller;
  } catch (err) {
    console.error('getSellerDetails error:', err);
    return null;
  }
}

export default async function SellerStorefront({
  params
}: {
  params: Promise<{ sellerId: string }>
}) {
  const { sellerId } = await params;
  const seller = await getSellerDetails(sellerId);
  
  if (!seller) {
    notFound();
  }

  const products = await getProductsServer({ sellerId, activeOnly: true });

  return (
    <div className="w-full bg-background min-h-screen pb-16">
      {/* Store Banner */}
      <div 
        className="w-full h-48 md:h-64 bg-border relative overflow-hidden"
        style={{
          backgroundImage: seller.banner_url ? `url(${seller.banner_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!seller.banner_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-emerald-800 to-emerald-600">
            <span className="text-white/30 text-4xl font-bold uppercase tracking-widest">{seller.store_name}</span>
          </div>
        )}
      </div>
      
      {/* Store Info */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-8 sm:mb-12 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 bg-surface rounded-full p-2 shadow-md border border-border flex-shrink-0">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt={seller.store_name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-success-bg text-success rounded-full flex items-center justify-center text-4xl font-bold">
                {seller.store_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left pb-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-1">{seller.store_name}</h1>
            <p className="text-sm sm:text-base text-foreground-muted flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              {seller.state || 'Verified Seller'} • {seller.category || 'Quality Products'}
            </p>
          </div>
        </div>

        {seller.description && (
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border mb-8 max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground mb-2">About Store</h2>
            <p className="text-foreground-muted leading-relaxed">{seller.description}</p>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 border-b border-border pb-2">
            All Products ({products.length})
          </h2>
          
          {products.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
              <p className="text-foreground-muted">This store hasn't listed any active products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
