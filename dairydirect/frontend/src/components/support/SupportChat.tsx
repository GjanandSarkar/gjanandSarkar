"use client";

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, ArrowLeft, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getUserOrders, type OrderWithItems } from '@/lib/api/orders';
import {
  FAQS,
  TOPIC_LABELS,
  faqsByTopic,
  searchFaqs,
  SUPPORT_CONTACT,
  type FaqTopic,
} from '@/lib/support/knowledge-base';
import {
  explainRefund,
  formatOrderLine,
  greeting,
  newId,
  rootQuickReplies,
  type ChatMessage,
  type QuickReply,
} from '@/lib/support/assistant';

/**
 * Scripted, order-aware support assistant.
 *
 * It is NOT a language model. Answers come from a reviewed knowledge base
 * and, for anything order-specific, from the customer's real orders. That
 * means it cannot invent a refund timeline or a delivery promise -- which is
 * the failure mode that actually costs you money in support calls. When it
 * cannot match a question it says so and offers a human, rather than
 * guessing.
 */
export function SupportChat() {
  const user = useStore((s) => s.user);
  const isSignedIn = Boolean(user);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [orders, setOrders] = useState<OrderWithItems[] | null>(null);
  const [handoffSent, setHandoffSent] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Show launcher button ONLY when the footer is in view
  useEffect(() => {
    const footerEl = document.getElementById('main-footer') || document.querySelector('footer');
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.05,
      }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  // Seed the greeting the first time the panel is opened.
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([greeting(isSignedIn, user?.name?.split(' ')[0] ?? null)]);
    }
  }, [isOpen, isSignedIn, user?.name, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen]);

  // Close on Escape so keyboard users are never trapped.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const push = (msg: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: newId() }]);

  const pushBot = (
    text: string,
    quickReplies?: QuickReply[],
    tone: ChatMessage['tone'] = 'default'
  ) => push({ sender: 'bot', text, quickReplies, tone });

  async function loadOrders(): Promise<OrderWithItems[]> {
    if (orders) return orders;
    const data = await getUserOrders(user?.id);
    setOrders(data);
    return data;
  }

  // ─── Actions ────────────────────────────────────────────────────────────
  async function runAction(action: string, payload?: string) {
    if (action === 'root') {
      pushBot('What else can I help with?', rootQuickReplies(isSignedIn));
      return;
    }

    if (action === 'topic' && payload) {
      const topic = payload as FaqTopic;
      const entries = faqsByTopic(topic);
      pushBot(
        `Here are the common ${TOPIC_LABELS[topic].toLowerCase()} questions. Pick one, or type your own question.`,
        [
          ...entries.map((f) => ({ label: f.question, action: 'faq', payload: f.id })),
          { label: '← Back', action: 'root' },
        ]
      );
      return;
    }

    if (action === 'faq' && payload) {
      const faq = FAQS.find((f) => f.id === payload);
      if (faq) {
        pushBot(faq.answer, [
          { label: 'That helped', action: 'resolved' },
          { label: 'Talk to a human', action: 'handoff' },
          { label: '← Back', action: 'root' },
        ]);
      }
      return;
    }

    if (action === 'resolved') {
      pushBot('Good. I am here if anything else comes up.', rootQuickReplies(isSignedIn));
      return;
    }

    if (action === 'my-orders' || action === 'refund-menu') {
      if (!isSignedIn) {
        pushBot('Please sign in first and I can look up your orders.', [
          { label: '← Back', action: 'root' },
        ]);
        return;
      }
      setIsBusy(true);
      try {
        const data = await loadOrders();
        if (data.length === 0) {
          pushBot('I cannot see any orders on your account yet.', [
            { label: '← Back', action: 'root' },
          ]);
          return;
        }
        const recent = data.slice(0, 5);
        const verb = action === 'refund-menu' ? 'check the refund position on' : 'tell you more about';
        pushBot(
          `Here are your most recent orders. Which one should I ${verb}?`,
          [
            ...recent.map((o) => ({
              label: formatOrderLine(o),
              action: action === 'refund-menu' ? 'order-refund' : 'order-status',
              payload: o.id,
            })),
            { label: '← Back', action: 'root' },
          ]
        );
      } catch {
        pushBot(
          'I could not load your orders just now. You can see them on the My Orders page, or I can pass this to a person.',
          [{ label: 'Talk to a human', action: 'handoff' }, { label: '← Back', action: 'root' }]
        );
      } finally {
        setIsBusy(false);
      }
      return;
    }

    if ((action === 'order-status' || action === 'order-refund') && payload) {
      const order = (orders ?? []).find((o) => o.id === payload);
      if (!order) {
        pushBot('I lost track of that order. Let us start again.', rootQuickReplies(isSignedIn));
        return;
      }

      if (action === 'order-refund') {
        const { text, tone } = explainRefund(order);
        pushBot(text, [
          { label: 'Talk to a human', action: 'handoff' },
          { label: '← Back', action: 'root' },
        ], tone);
        return;
      }

      const itemCount = order.order_items?.length ?? 0;
      pushBot(
        `${formatOrderLine(order)}${itemCount ? ` It has ${itemCount} item${itemCount > 1 ? 's' : ''}.` : ''} Payment method: ${order.payment_method}.`,
        [
          { label: 'Refund or cancellation', action: 'order-refund', payload: order.id },
          { label: 'Talk to a human', action: 'handoff' },
          { label: '← Back', action: 'root' },
        ]
      );
      return;
    }

    if (action === 'handoff') {
      pushBot(
        'I can pass this to a person. Describe the problem in one message below and I will raise a support ticket with your account details attached.',
        []
      );
      setHandoffSent(false);
      return;
    }
  }

  // ─── Free text ──────────────────────────────────────────────────────────
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    push({ sender: 'user', text });
    setInput('');

    // If the last bot turn asked for a handoff description, raise a ticket.
    const lastBot = [...messages].reverse().find((m) => m.sender === 'bot');
    const awaitingHandoff =
      lastBot?.text.startsWith('I can pass this to a person') && !handoffSent;

    if (awaitingHandoff) {
      setIsBusy(true);
      try {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            subject: 'Help requested from the support assistant',
            message: text,
            priority: 'normal',
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            userId: user?.id,
          }),
        });
        if (res.ok) {
          setHandoffSent(true);
          pushBot(
            'Raised. Our team has your message and will get back to you. You can also reach us directly if it is urgent.',
            rootQuickReplies(isSignedIn),
            'success'
          );
        } else {
          pushBot(
            'I could not raise the ticket just now. Please use the contact details below and we will pick it up.',
            rootQuickReplies(isSignedIn),
            'warning'
          );
        }
      } catch {
        pushBot(
          'I could not reach our servers. Please use the contact details below.',
          rootQuickReplies(isSignedIn),
          'warning'
        );
      } finally {
        setIsBusy(false);
      }
      return;
    }

    // Otherwise answer from the knowledge base.
    const matches = searchFaqs(text);
    if (matches.length === 0) {
      pushBot(
        'I do not have a confident answer for that one, and I would rather not guess. A person can help.',
        [
          { label: 'Talk to a human', action: 'handoff' },
          { label: 'Show main menu', action: 'root' },
        ],
        'warning'
      );
      return;
    }

    const [best, ...others] = matches;
    pushBot(best.answer, [
      ...others.map((f) => ({ label: f.question, action: 'faq', payload: f.id })),
      { label: 'That helped', action: 'resolved' },
      { label: 'Talk to a human', action: 'handoff' },
    ]);
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Launcher. Only visible when footer is in view (per user requirement) */}
      {!isOpen && isFooterVisible && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open help and support"
          className="fixed z-50 bottom-24 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full bg-primary text-foreground-inverse shadow-lg flex items-center justify-center transition-all duration-300 animate-in fade-in zoom-in-90 active:scale-95 hover:scale-105 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Help and support"
          className="fixed z-50 inset-x-0 bottom-0 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] h-[85vh] md:h-[580px] md:max-h-[80vh] bg-surface text-foreground md:rounded-xl rounded-t-xl shadow-2xl border border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">Help &amp; Support</p>
                <p className="text-[11px] opacity-80 leading-tight truncate">
                  {SUPPORT_CONTACT.hours}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close help and support"
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-background">
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <div
                  className={
                    m.sender === 'user'
                      ? 'ml-auto max-w-[85%] rounded-xl rounded-br-xs bg-primary text-white px-3.5 py-2.5 text-xs font-medium'
                      : [
                          'mr-auto max-w-[90%] rounded-xl rounded-bl-xs px-3.5 py-2.5 text-xs font-medium border shadow-2xs',
                          m.tone === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                            : m.tone === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                              : 'bg-surface border-border text-foreground',
                        ].join(' ')
                  }
                >
                  {m.text}
                </div>

                {m.quickReplies && m.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.quickReplies.map((qr, i) => (
                      <button
                        key={`${m.id}-qr-${i}`}
                        onClick={() => runAction(qr.action, qr.payload)}
                        disabled={isBusy}
                        className="text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border/80 text-foreground bg-surface hover:bg-surface-muted hover:border-primary transition-colors disabled:opacity-50 max-w-full shadow-2xs cursor-pointer"
                      >
                        {qr.action === 'root' && <ArrowLeft className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isBusy && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Direct contact routes */}
          {(SUPPORT_CONTACT.phone || SUPPORT_CONTACT.email) && (
            <div className="px-3 py-2 border-t border-border bg-surface flex items-center gap-3 text-[11px] shrink-0">
              {SUPPORT_CONTACT.phone && (
                <a href={`tel:${SUPPORT_CONTACT.phone}`} className="flex items-center gap-1 font-semibold text-primary">
                  <Phone className="w-3.5 h-3.5" /> {SUPPORT_CONTACT.phone}
                </a>
              )}
              {SUPPORT_CONTACT.email && (
                <a href={`mailto:${SUPPORT_CONTACT.email}`} className="flex items-center gap-1 font-semibold text-primary truncate">
                  <Mail className="w-3.5 h-3.5" /> {SUPPORT_CONTACT.email}
                </a>
              )}
              <Link href="/support" className="ml-auto font-semibold text-muted hover:text-foreground shrink-0">
                Support centre
              </Link>
            </div>
          )}

          {/* Composer */}
          <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              aria-label="Type your question"
              maxLength={500}
              className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isBusy}
              aria-label="Send message"
              className="h-10 w-10 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
