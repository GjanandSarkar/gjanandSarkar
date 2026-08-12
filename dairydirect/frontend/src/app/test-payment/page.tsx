"use client";

import React, { useState } from 'react';
import { initiateRazorpayPayment, RazorpaySuccessResponse } from '@/lib/razorpay-client';
import { ShieldCheck, CreditCard, CheckCircle2, AlertCircle, RefreshCw, Terminal, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestPaymentPage() {
  const [amount, setAmount] = useState<number>(100);
  const [customerName, setCustomerName] = useState<string>('Gjanand Test User');
  const [customerEmail, setCustomerEmail] = useState<string>('customer@example.com');
  const [customerPhone, setCustomerPhone] = useState<string>('9876543210');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'failed' | 'dismissed'>('idle');
  const [logs, setLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error'; message: string; data?: any }>>([]);
  const [paymentResult, setPaymentResult] = useState<{
    orderId?: string;
    paymentId?: string;
    signature?: string;
    verified?: boolean;
  }>({});

  const addLog = (type: 'info' | 'success' | 'error', message: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, type, message, data }]);
  };

  const handleTestCheckout = async () => {
    setStatus('loading');
    setLogs([]);
    setPaymentResult({});
    addLog('info', `Initiating Razorpay Checkout for ₹${amount} (${amount * 100} paise)...`);

    try {
      await initiateRazorpayPayment({
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Gjanand Sarkar Test',
        description: 'Test Checkout Sandbox Transaction',
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          testMode: 'true',
          timestamp: new Date().toISOString(),
        },
        onSuccess: (response: RazorpaySuccessResponse, verificationData: any) => {
          setStatus('success');
          setPaymentResult({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            verified: verificationData?.success,
          });
          addLog('success', 'Payment authorized and signature verified by server!', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            signature_preview: response.razorpay_signature.slice(0, 16) + '...',
            serverVerification: verificationData,
          });
        },
        onError: (error) => {
          setStatus('failed');
          addLog('error', `Payment failed or verification error: ${error.message}`, error.details);
        },
        onDismiss: () => {
          if (status !== 'success') {
            setStatus('dismissed');
            addLog('info', 'Checkout modal dismissed by user (cancelled).');
          }
        },
      });
    } catch (err: any) {
      setStatus('failed');
      addLog('error', `Unexpected error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12 px-4 sm:px-6 lg:px-8 font-sans text-stone-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b4332]/10 text-[#1b4332] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Razorpay Integration Testbed
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b4332] tracking-tight">
            Razorpay Standard Web Checkout
          </h1>
          <p className="text-sm text-stone-500 max-w-xl mx-auto">
            Test the complete end-to-end payment lifecycle: order creation (`/api/create-order`), checkout modal UI, and cryptographic signature verification (`/api/verify-payment`).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Controls Form */}
          <div className="md:col-span-6 bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-stone-200/80 space-y-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1b4332]" />
              Payment Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Amount (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332]"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[10, 50, 100, 499, 999].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        amount === preset
                          ? 'bg-[#1b4332] text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1b4332]/20 focus:border-[#1b4332]"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestCheckout}
              disabled={status === 'loading' || amount < 1}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#143427] hover:to-[#22533e] shadow-[0_4px_16px_rgba(27,67,50,0.3)] transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Launch Razorpay Checkout (₹{amount})</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>

            {/* Test Helper Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Razorpay Test Credentials
              </div>
              <p className="text-[11px] text-amber-700">
                In the Razorpay checkout popup, you can use any valid UPI handle (e.g. <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">success@razorpay</code>) or test card.
              </p>
            </div>
          </div>

          {/* Real-time Status & Terminal Logs */}
          <div className="md:col-span-6 flex flex-col space-y-6">
            
            {/* Status Card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-stone-200/80 space-y-4">
              <h2 className="text-lg font-bold text-stone-900 flex items-center justify-between">
                <span>Transaction Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                  status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                  status === 'failed' ? 'bg-red-100 text-red-800' :
                  status === 'dismissed' ? 'bg-amber-100 text-amber-800' :
                  status === 'loading' ? 'bg-blue-100 text-blue-800' :
                  'bg-stone-100 text-stone-600'
                }`}>
                  {status}
                </span>
              </h2>

              {status === 'success' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Payment & Cryptographic Signature Verified
                  </div>
                  <div className="font-mono text-[11px] text-emerald-700 space-y-1 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                    <div><strong>Order ID:</strong> {paymentResult.orderId}</div>
                    <div><strong>Payment ID:</strong> {paymentResult.paymentId}</div>
                    <div><strong>Signature:</strong> {paymentResult.signature?.slice(0, 24)}...</div>
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Payment was unsuccessful or signature verification failed.</span>
                </div>
              )}

              {status === 'dismissed' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-medium">
                  Modal was dismissed without completing payment.
                </div>
              )}

              {status === 'idle' && (
                <p className="text-xs text-stone-500">
                  Ready to test. Click the button above to launch the Razorpay Standard Checkout overlay.
                </p>
              )}
            </div>

            {/* Live Console Logs */}
            <div className="flex-1 bg-[#1e293b] rounded-3xl p-5 shadow-lg text-stone-200 font-mono text-xs space-y-3 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Live Event Stream
                </div>
                <span>{logs.length} events</span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-1">
                {logs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-8">
                    Awaiting checkout initialization...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 text-[10px] shrink-0">{log.time}</span>
                        <span className={
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'error' ? 'text-rose-400' :
                          'text-cyan-300'
                        }>
                          {log.message}
                        </span>
                      </div>
                      {log.data && (
                        <pre className="text-[10px] text-slate-300 bg-slate-900/80 p-2 rounded-lg overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1b4332] hover:underline"
          >
            Go to Store Checkout Page &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
