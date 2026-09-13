"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', orderId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login?redirect=/support');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ subject: '', message: '', orderId: '' });
        setShowNew(false);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading || loading) {
    return <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen pb-16">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Support Tickets</h1>
          <button 
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            {showNew ? 'Cancel' : <><Plus className="w-4 h-4" /> New Ticket</>}
          </button>
        </div>

        {showNew && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input 
                  type="text" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="What do you need help with?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID (Optional)</label>
                <input 
                  type="text" value={form.orderId} onChange={e => setForm({...form, orderId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Describe your issue in detail..."
                ></textarea>
              </div>
              <button 
                type="submit" disabled={submitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You don't have any support tickets yet.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{ticket.message}</p>
                <div className="flex items-center text-xs text-gray-400 gap-4">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.order_id && <span>Order: {ticket.order_id.slice(0,8)}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
