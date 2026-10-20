'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  RotateCcw,
  RefreshCw,
  Truck,
  IndianRupee,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { StatusBar, RETURN_STEPS, REPLACEMENT_STEPS } from '@/components/orders/StatusBar';

export default function ReturnRequestDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequest() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/returns/${params.id}`);
        if (!res.ok) {
          throw new Error('Request not found');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load return details');
      } finally {
        setIsLoading(false);
      }
    }
    loadRequest();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">{error || 'Could not find this return request'}</p>
        <Link
          href="/returns"
          className="px-5 py-2.5 bg-[#0f3e26] text-white text-xs font-bold rounded-xl shadow-sm"
        >
          Back to Returns
        </Link>
      </div>
    );
  }

  const { request, times = {}, refund } = data;
  const isReturn = request.request_type === 'return';
  const steps = isReturn ? RETURN_STEPS : REPLACEMENT_STEPS;
  const item = request.order_items;
  const order = request.orders;
  const address = request.user_addresses;

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 pt-12 md:pt-16">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/returns"
            className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Request Reference</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isReturn ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {request.request_type}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              Request #{request.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Created on {new Date(request.created_at).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Status Bar Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 md:p-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
            Fulfillment Progression
          </h2>
          <div className="py-2">
            <StatusBar
              steps={steps}
              current={request.status}
              times={times}
              failed={request.status === 'rejected'}
            />
          </div>

          {/* Customer Contextual Message */}
          <div className="mt-8 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              {request.status === 'initiated' && (
                <p>
                  <span className="font-bold text-gray-900">Request Auto-Approved: </span>
                  Our delivery executive or seller partner will collect the product from your address. Please keep the item ready with original packaging.
                </p>
              )}
              {request.status === 'picked_up' && (
                <p>
                  <span className="font-bold text-gray-900">Item Picked Up: </span>
                  The parcel has been collected and is safely on its way back to the fulfillment center.
                </p>
              )}
              {request.status === 'received' && (
                <p>
                  <span className="font-bold text-gray-900">Item Received: </span>
                  The item has been received. Your refund initiation is starting automatically.
                </p>
              )}
              {request.status === 'refund_initiated' && (
                <p>
                  <span className="font-bold text-gray-900">Refund in Progress: </span>
                  A refund of ₹{Number(request.refund_amount).toFixed(2)} has been submitted to your original payment gateway.
                </p>
              )}
              {request.status === 'refunded' && (
                <p>
                  <span className="font-bold text-emerald-900">Refund Processed: </span>
                  Your refund has been approved and sent to your bank account. Depending on your bank, it may take 5 to 7 working days to reflect on your statement.
                </p>
              )}
              {request.status === 'completed' && request.request_type === 'replacement' && (
                <p>
                  <span className="font-bold text-emerald-900">Replacement Dispatched: </span>
                  Your fresh replacement product has been sent! Tracking: <span className="font-semibold text-gray-900">{request.replacement_tracking_no || 'Standard Farm Courier'}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Item & Refund Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item details */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-[#c88a23]" />
              <span>Requested Item</span>
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                {item?.image_url || item?.products?.image_url ? (
                  <img src={item.image_url || item?.products?.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item?.product_name || 'Dairy Product'}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(item?.variant_weight || item?.variant_name) ? `${item?.variant_weight || item?.variant_name} · ` : ''}Qty: {item?.quantity || 1}
                </p>
                <p className="text-xs font-black text-gray-900 mt-1">
                  ₹{Number(item?.total_price || (Number(item?.price || item?.unit_price || 0) * Number(item?.quantity || 1))).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-1 text-xs">
              <p className="text-gray-500">
                <span className="font-semibold text-gray-700">Reason:</span> {request.reason}
              </p>
              {request.description && (
                <p className="text-gray-500">
                  <span className="font-semibold text-gray-700">Description:</span> {request.description}
                </p>
              )}
            </div>

            {/* Proof Images if any */}
            {request.images && request.images.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Uploaded Photos
                </span>
                <div className="flex items-center gap-2">
                  {request.images.map((imgUrl: string, idx: number) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity block"
                    >
                      <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refund / Dispatch information */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-700" />
              <span>{isReturn ? 'Refund Details' : 'Replacement Logistics'}</span>
            </h3>

            {isReturn ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-950">Refund Amount</span>
                  <span className="text-lg font-black text-emerald-700">
                    ₹{Number(request.refund_amount).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-semibold text-gray-800">Original Payment:</span>{' '}
                    {order?.payment_method || 'Online'}
                  </p>
                  {refund?.method === 'manual_upi' && (
                    <p>
                      <span className="font-semibold text-gray-800">Payout Method:</span> Manual UPI Transfer (
                      {refund?.destination?.upi_id || 'On File'})
                    </p>
                  )}
                  {refund?.razorpay_refund_id && (
                    <p className="font-mono text-[11px]">
                      <span className="font-semibold text-gray-800">Gateway Ref:</span>{' '}
                      {refund.razorpay_refund_id}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-gray-800">Refund Status:</span>{' '}
                    <span className="capitalize font-bold text-gray-900">
                      {refund?.status || (request.status === 'refunded' ? 'completed' : 'pending')}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <span className="text-xs font-semibold text-blue-950 block">Replacement Dispatch</span>
                  <span className="text-sm font-black text-blue-900">
                    {request.replacement_tracking_no || 'Awaiting Item Pickup & Inspection'}
                  </span>
                </div>

                {request.replacement_dispatched_at && (
                  <p className="text-xs text-gray-600">
                    Dispatched on {new Date(request.replacement_dispatched_at).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            {/* Pickup Address */}
            {address && (
              <div className="pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Pickup Address
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {address.street_address}, {address.city} - {address.postal_code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
