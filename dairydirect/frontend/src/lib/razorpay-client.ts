/**
 * Razorpay Standard Web Checkout Client Integration
 * Loads https://checkout.razorpay.com/v1/checkout.js and provides helpers
 * for opening the checkout modal, handling payment events, and verifying signatures.
 */

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
 * 2. Create order via /api/create-order
 * 3. Open Razorpay modal
 * 4. Verify signature on success via /api/verify-payment
 */
export async function initiateRazorpayPayment({
  amount,
  currency = 'INR',
  receipt,
  name = 'Gjanand Sarkar',
  description = 'Farm Fresh Dairy Order',
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

    // 2. Call backend to create Razorpay order
    const createRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.order_id) {
      const err = { 
        message: createData.error || 'Failed to initialize payment order', 
        details: createData 
      };
      onError?.(err);
      return;
    }

    const keyId = createData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      onError?.({ message: 'Razorpay Key ID is not configured.' });
      return;
    }

    // 3. Configure Razorpay modal options
    const options: RazorpayOptions = {
      key: keyId,
      amount: createData.amount,
      currency: createData.currency,
      name,
      description,
      image: '/logo.svg',
      order_id: createData.order_id,
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      notes: notes || {},
      theme: {
        color: '#1b4332',
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
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

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
