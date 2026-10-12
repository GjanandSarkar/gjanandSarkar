import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CustomerOrderDetailsClient } from '@/components/orders/CustomerOrderDetailsClient';

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
        <p className="text-red-500 font-semibold">Error loading order: {result.error}</p>
      </div>
    );
  }

  return <CustomerOrderDetailsClient initialOrder={result.order} />;
}
