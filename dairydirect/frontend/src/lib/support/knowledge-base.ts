/**
 * Support knowledge base for the help assistant.
 *
 * This is deliberately a fixed, reviewed dataset rather than a language
 * model. Everything in here is a policy statement a customer may act on --
 * refund windows, delivery promises, cancellation rules -- so it has to be
 * something your team wrote and can audit, not something generated at
 * runtime. Anything the assistant says about a SPECIFIC order is read from
 * the orders API instead, so it can never invent an order status.
 *
 * To change what the assistant tells customers, edit this file.
 */

export type FaqTopic =
  | 'orders'
  | 'delivery'
  | 'payments'
  | 'refunds'
  | 'returns'
  | 'account'
  | 'products'
  | 'sellers';

export interface FaqEntry {
  id: string;
  topic: FaqTopic;
  question: string;
  answer: string;
  /** Extra words a customer might use that are not in the question itself. */
  keywords: string[];
}

export const TOPIC_LABELS: Record<FaqTopic, string> = {
  orders: 'Orders',
  delivery: 'Delivery',
  payments: 'Payments',
  refunds: 'Refunds',
  returns: 'Returns',
  account: 'Account',
  products: 'Products',
  sellers: 'Selling on Gjanand Sarkar',
};

export const FAQS: FaqEntry[] = [
  // ─── Orders ───────────────────────────────────────────────────────────
  {
    id: 'order-track',
    topic: 'orders',
    question: 'How do I track my order?',
    answer:
      'Open My Orders and select the order you want to follow. Each order shows its current stage, from Confirmed through Out for Delivery to Delivered. If you are signed in, I can also read your recent orders out for you here.',
    keywords: ['track', 'where', 'status', 'location', 'shipment'],
  },
  {
    id: 'order-cancel',
    topic: 'orders',
    question: 'Can I cancel my order?',
    answer:
      'You can cancel any order that has not been delivered yet. Open the order and choose Cancel Order. Once an order is marked Delivered it can no longer be cancelled, because the items are already with you; request a return instead.',
    keywords: ['cancel', 'stop', 'cancellation', 'call off'],
  },
  {
    id: 'order-change',
    topic: 'orders',
    question: 'Can I change the items or address after ordering?',
    answer:
      'Items cannot be changed once an order is placed. Cancel the order and place a new one, as long as it has not been delivered. For a delivery address correction, contact us straight away and we will try to update it before dispatch.',
    keywords: ['change', 'edit', 'modify', 'wrong address', 'update address'],
  },
  {
    id: 'order-missing',
    topic: 'orders',
    question: 'An item is missing or damaged in my order',
    answer:
      'We are sorry about that. Report it within 48 hours of delivery and we will arrange a replacement or a refund. Use the Talk to a human option below with your order number and, if you can, a photo of what arrived.',
    keywords: ['missing', 'damaged', 'broken', 'wrong item', 'not received', 'incomplete'],
  },

  // ─── Delivery ─────────────────────────────────────────────────────────
  {
    id: 'delivery-time',
    topic: 'delivery',
    question: 'How long does delivery take?',
    answer:
      'Once your order is confirmed we prepare it and dispatch it as quickly as we can. You do not need to pick a delivery slot; your order moves to Out for Delivery as soon as it is ready, and you can watch its progress in My Orders.',
    keywords: ['how long', 'when', 'time', 'slot', 'eta', 'arrive', 'fast'],
  },
  {
    id: 'delivery-fee',
    topic: 'delivery',
    question: 'How much is delivery, and when is it free?',
    answer:
      'The delivery fee is calculated at checkout and shown in the order summary before you pay. Orders above the free-delivery threshold shown in your cart ship free; the cart tells you exactly how much more you need to add to qualify.',
    keywords: ['fee', 'charge', 'free', 'shipping cost', 'delivery charge'],
  },
  {
    id: 'delivery-area',
    topic: 'delivery',
    question: 'Do you deliver to my area?',
    answer:
      'We deliver across India. Enter your pincode when you add a delivery address and we will confirm whether we currently serve it. If we do not reach you yet, please do check back as we are expanding.',
    keywords: ['area', 'pincode', 'location', 'serviceable', 'city', 'deliver to'],
  },

  // ─── Payments ─────────────────────────────────────────────────────────
  {
    id: 'pay-methods',
    topic: 'payments',
    question: 'What payment methods can I use?',
    answer:
      'You can pay online by UPI, card, net banking or wallet through Razorpay, or choose Cash on Delivery and pay when your order arrives.',
    keywords: ['payment', 'upi', 'card', 'netbanking', 'wallet', 'cod', 'cash', 'razorpay', 'pay'],
  },
  {
    id: 'pay-failed',
    topic: 'payments',
    question: 'My payment failed but money left my account',
    answer:
      'If a payment fails, the amount is usually only held, not taken, and your bank releases it automatically within 5 to 7 working days. No order is created for a failed payment. If the money has not returned after 7 working days, contact us with your order number and the bank reference and we will chase it.',
    keywords: ['failed', 'deducted', 'debited', 'money gone', 'charged', 'not confirmed', 'stuck'],
  },
  {
    id: 'pay-cod',
    topic: 'payments',
    question: 'How does Cash on Delivery work?',
    answer:
      'With Cash on Delivery you pay nothing when you place the order. You pay the delivery agent when your order reaches you. This means that if an order is cancelled before it is delivered, there is nothing to refund, because no money has changed hands.',
    keywords: ['cod', 'cash on delivery', 'pay later', 'pay at door'],
  },

  // ─── Refunds ──────────────────────────────────────────────────────────
  {
    id: 'refund-when',
    topic: 'refunds',
    question: 'When will I get my refund?',
    answer:
      'Refunds apply to orders you paid for online. Once a refund is approved we send it back to the original payment method, and banks typically take 5 to 7 working days to show it. You will see the refund against the order in My Orders.',
    keywords: ['refund', 'money back', 'when', 'how long', 'credited', 'return money'],
  },
  {
    id: 'refund-cod',
    topic: 'refunds',
    question: 'My Cash on Delivery order was cancelled. Do I get a refund?',
    answer:
      'With Cash on Delivery you only pay when the order is handed to you, so if an order is cancelled before delivery no money ever left your account and there is nothing to refund. If you had already paid cash and the item was then returned or taken back, that is different: contact us and we will arrange the money back to your UPI or bank account.',
    keywords: ['cod refund', 'cash refund', 'cancelled cod', 'cod cancelled'],
  },
  {
    id: 'refund-where',
    topic: 'refunds',
    question: 'Where does my refund go?',
    answer:
      'Online payments are refunded to the same card, UPI ID or account you paid from. We cannot redirect a refund to a different account, because the reversal goes back along the original payment route.',
    keywords: ['where', 'which account', 'original', 'different account'],
  },

  // ─── Returns ──────────────────────────────────────────────────────────
  {
    id: 'return-how',
    topic: 'returns',
    question: 'How do I return something?',
    answer:
      'Open the delivered order in My Orders and choose Request a Return, telling us what went wrong. Once the return is approved we arrange collection, and the refund is issued after the item reaches us and is checked.',
    keywords: ['return', 'send back', 'exchange', 'replace', 'give back'],
  },
  {
    id: 'return-window',
    topic: 'returns',
    question: 'How long do I have to return an item?',
    answer:
      'Report a damaged, missing or incorrect item within 48 hours of delivery. Other returns depend on the product category, and the return option appears on the order itself while it is still eligible.',
    keywords: ['window', 'how long', 'days', 'deadline', 'late'],
  },

  // ─── Account ──────────────────────────────────────────────────────────
  {
    id: 'account-login',
    topic: 'account',
    question: 'I cannot sign in',
    answer:
      'Sign in with the mobile number or Google account you registered with. If an OTP does not arrive, wait for the timer to finish and request it again, and check that the number you typed is the one you registered.',
    keywords: ['login', 'sign in', 'otp', 'password', 'cannot', 'locked out', 'access'],
  },
  {
    id: 'account-address',
    topic: 'account',
    question: 'How do I add or change a delivery address?',
    answer:
      'Go to Saved Addresses in your profile to add, edit or remove an address, and to choose your default. You can also add a new address during checkout.',
    keywords: ['address', 'add address', 'change address', 'saved'],
  },

  // ─── Products ─────────────────────────────────────────────────────────
  {
    id: 'product-genuine',
    topic: 'products',
    question: 'Are the products genuine?',
    answer:
      'Yes. We partner with a single verified company per category, so everything in a category comes from one accountable, known supplier rather than an open marketplace of unchecked sellers.',
    keywords: ['genuine', 'authentic', 'fake', 'original', 'quality', 'real'],
  },
  {
    id: 'product-stock',
    topic: 'products',
    question: 'An item is out of stock. When will it return?',
    answer:
      'Stock counts update live as orders are placed. We do not have a fixed restock date for every item, so the best approach is to check the product page again shortly.',
    keywords: ['out of stock', 'sold out', 'unavailable', 'restock', 'back in stock'],
  },

  // ─── Sellers ──────────────────────────────────────────────────────────
  {
    id: 'seller-join',
    topic: 'sellers',
    question: 'How can my company sell on Gjanand Sarkar?',
    answer:
      'We work with one partner company per product category. Apply through Become a Seller and our team will review your company against the category you are applying for.',
    keywords: ['sell', 'seller', 'partner', 'vendor', 'business', 'join', 'supplier'],
  },
];

/** Lowercase word tokens, ignoring very short filler words. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'you', 'your', 'can', 'how', 'what', 'when', 'where',
  'will', 'this', 'that', 'with', 'have', 'has', 'are', 'was', 'were', 'but',
  'not', 'from', 'get', 'got', 'does', 'did', 'his', 'her', 'any', 'all',
  'please', 'help', 'need', 'want', 'know', 'tell',
]);

/**
 * Score FAQs against a free-text question and return the best matches.
 *
 * Simple keyword overlap with weighting: an explicit keyword hit counts for
 * more than a word that merely appears in the answer text. It returns an
 * empty array when nothing scores, so the caller can offer a human handoff
 * rather than a confidently wrong answer.
 */
export function searchFaqs(query: string, limit = 3): FaqEntry[] {
  const words = tokenize(query).filter((w) => !STOP_WORDS.has(w));
  if (words.length === 0) return [];

  const scored = FAQS.map((faq) => {
    const question = faq.question.toLowerCase();
    const answer = faq.answer.toLowerCase();
    const keywords = faq.keywords.map((k) => k.toLowerCase());

    let score = 0;
    for (const word of words) {
      if (keywords.some((k) => k.includes(word) || word.includes(k))) score += 5;
      if (question.includes(word)) score += 3;
      if (answer.includes(word)) score += 1;
    }
    // Whole-phrase match on a keyword is a strong signal.
    const q = query.toLowerCase();
    if (keywords.some((k) => q.includes(k))) score += 4;

    return { faq, score };
  })
    .filter((r) => r.score >= 5)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((r) => r.faq);
}

export function faqsByTopic(topic: FaqTopic): FaqEntry[] {
  return FAQS.filter((f) => f.topic === topic);
}

/** Contact routes offered when the assistant cannot resolve something. */
export const SUPPORT_CONTACT = {
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  hours: 'Monday to Saturday, 9:00 AM to 7:00 PM IST',
};
