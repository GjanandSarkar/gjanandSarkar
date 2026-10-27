/**
 * Razorpay Standard Web Checkout Client Integration
 * Loads https://checkout.razorpay.com/v1/checkout.js and provides helpers
 * for opening the checkout modal, handling payment events, and verifying signatures.
 */

import { getAuthToken } from '@/lib/api/client';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id?: string;
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
      close?: () => void;
    };
  }
}

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the Razorpay Standard Checkout SDK script.
 * Caches the loading promise to prevent duplicate script tags.
 */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay] Failed to load checkout.js SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export interface InitiatePaymentParams {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  items?: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess: (response: RazorpaySuccessResponse, verificationResult: any) => void | Promise<void>;
  onError?: (error: { message: string; details?: any }) => void;
  onDismiss?: () => void;
}

/**
 * High-level helper to execute complete Razorpay Standard Checkout flow:
 * 1. Load SDK script
 * 2. Create order via /api/payments/razorpay/create (or fallback /api/create-order)
 * 3. Open Razorpay modal
 * 4. Verify signature on success via /api/verify-payment
 */
export async function initiateRazorpayPayment({
  amount,
  currency = 'INR',
  receipt,
  name = 'Gjanand Sarkar',
  description = 'Gjanand Sarkar Order',
  items,
  couponCode,
  prefill,
  notes,
  onSuccess,
  onError,
  onDismiss,
}: InitiatePaymentParams): Promise<void> {
  try {
    // 1. Ensure Razorpay checkout script is loaded
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      const err = { message: 'Razorpay SDK failed to load. Please check your internet connection.' };
      onError?.(err);
      return;
    }

    // 2. Prepare auth header
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let createRes: Response;
    let createData: any;

    // Use secure server-calculated order creation if items are provided
    if (items && items.length > 0) {
      createRes = await fetch('/api/payments/razorpay/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items, couponCode }),
      });
    } else {
      createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          currency,
          receipt,
          notes,
        }),
      });
    }

    // Safely parse JSON response to prevent HTML doctype parse errors
    try {
      createData = await createRes.json();
    } catch {
      const err = { message: `Payment service unavailable (${createRes.status}). Please try again.` };
      onError?.(err);
      return;
    }

    const orderId = createData.razorpayOrderId || createData.order_id;

    if (!createRes.ok || !orderId) {
      const err = { 
        message: createData.error || 'Failed to initialize payment order', 
        details: createData 
      };
      onError?.(err);
      return;
    }

    const keyId = createData.keyId || createData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      onError?.({ message: 'Razorpay Key ID is not configured.' });
      return;
    }

    // 3. Configure Razorpay modal options
    const options: RazorpayOptions = {
      key: keyId,
      amount: createData.amount || amount,
      currency: createData.currency || currency,
      name,
      description,
      image: '/application logo/gjanand sarkar logo.png',
      order_id: orderId,
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      notes: notes || {},
      theme: {
        color: '#0c3c26',
        backdrop_color: 'rgba(0, 0, 0, 0.65)',
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          // 4. Verify signature with backend endpoint
          const verifyHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) verifyHeaders['Authorization'] = `Bearer ${token}`;

          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: verifyHeaders,
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          let verifyData: any;
          try {
            verifyData = await verifyRes.json();
          } catch {
            verifyData = { success: false, error: 'Failed to verify payment response format' };
          }

          if (!verifyRes.ok || !verifyData.success) {
            onError?.({
              message: verifyData.error || 'Payment signature verification failed.',
              details: verifyData,
            });
            return;
          }

          await onSuccess(response, verifyData);
        } catch (verError: any) {
          onError?.({
            message: verError.message || 'Error occurred while verifying payment.',
            details: verError,
          });
        }
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response: any) => {
      const errorObj = response.error as RazorpayErrorResponse;
      console.error('[Razorpay] Payment failed:', errorObj);
      onError?.({
        message: errorObj?.description || 'Payment was unsuccessful.',
        details: errorObj,
      });
    });

    rzp.open();
  } catch (error: any) {
    console.error('[Razorpay] Payment initiation error:', error);
    onError?.({
      message: error.message || 'An unexpected error occurred while starting payment.',
    });
  }
}
