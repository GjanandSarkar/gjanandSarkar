const getAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
};

export class RazorpayError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RazorpayError';
  }
}

export async function createRazorpayRefund(args: {
  paymentId: string;
  amountInr: number;
  refundRowId: string;
  meta: Record<string, string>;
}) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${args.paymentId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      'X-Refund-Idempotency': args.refundRowId,
    },
    body: JSON.stringify({
      amount: Math.round(args.amountInr * 100), // convert rupees to paise
      speed: process.env.RAZORPAY_REFUND_SPEED || 'normal',
      receipt: args.refundRowId,
      notes: args.meta,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new RazorpayError(json?.error?.description || 'Razorpay refund request failed', json?.error?.code);
  }
  return json as { id: string; status: string; speed_processed?: string; payment_id: string };
}

export async function fetchRazorpayRefund(refundId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/refunds/${refundId}`, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) {
    throw new RazorpayError('Could not fetch refund status from Razorpay');
  }
  return res.json();
}
