import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getOrderDetails(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('token')?.value;

    if (!token) return { error: 'Unauthorized', status: 401 };

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders?id=${id}`, {
      headers: {
        Cookie: cookieStore.toString(),
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { error: 'Failed to fetch', status: res.status };
    }

    const data = await res.json();
    return { order: data.order };
  } catch (err) {
    console.error('getOrderDetails error:', err);
    return { error: 'Internal error', status: 500 };
  }
}

export default async function OrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const result = await getOrderDetails(id);

  if (result.status === 401) {
    redirect('/auth/login');
  }

  if (result.status === 404 || !result.order) {
    notFound();
  }

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <p className="text-red-500">Error loading order: {result.error}</p>
      </div>
    );
  }

  const { order } = result;

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 capitalize">
            {order.status}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Summary</h2>
          <div className="space-y-4">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} • {item.weight}</p>
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  ₹{item.total_price}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <div className="text-gray-600">
              <p className="font-medium text-gray-900">{order.profiles?.name}</p>
              <p>{order.profiles?.phone}</p>
              <p className="mt-2">{order.shipping_address?.address || order.user_addresses?.address || 'No address provided'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="space-y-2 text-gray-600">
              <p className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium text-gray-900 capitalize">{order.payment_method || 'Online'}</span>
              </p>
              <p className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-gray-900 capitalize">{order.payment_status}</span>
              </p>
              <p className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Link 
            href={`/tracking/${order.id}`}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
