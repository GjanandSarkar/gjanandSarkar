"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Send,
  HelpCircle,
  Tag
} from 'lucide-react';
import { getAuthToken } from '@/lib/api/client';

export default function SupportPage() {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ 
    subject: '', 
    message: '', 
    orderId: '',
    priority: 'normal' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login?redirect=/support');
    }
  }, [user, isAuthLoading, router]);

  const fetchTickets = async () => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = user?.id ? `/api/support/tickets?userId=${encodeURIComponent(user.id)}` : '/api/support/tickets';
      const res = await fetch(url, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.subject.trim()) {
      setError('Please provide a subject for your ticket.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please describe your issue in the message box.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          subject: form.subject.trim(),
          message: form.message.trim(),
          orderId: form.orderId.trim(),
          priority: form.priority,
          userId: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to submit ticket');
      }

      setForm({ subject: '', message: '', orderId: '', priority: 'normal' });
      setShowNew(false);
      setSuccess('Your support ticket has been submitted successfully! Our team will look into it shortly.');
      await fetchTickets();
    } catch (e: any) {
      console.error('Submit ticket error:', e);
      setError(e.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26]" />
        <p className="text-xs font-bold text-gray-500">Loading support portal...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">In Progress</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">Closed</span>;
      case 'open':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Open</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">High</span>;
      case 'low':
        return <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Low</span>;
      case 'normal':
      default:
        return <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Normal</span>;
    }
  };

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen pb-16">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#c88a23]">Customer Care</span>
            <h1 className="text-2xl md:text-3xl font-black text-[#0f3e26]">Support Tickets</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-2xs disabled:opacity-50"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button 
              onClick={() => {
                setShowNew(!showNew);
                setError('');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f3e26] text-white text-xs font-bold rounded-xl hover:bg-[#144f31] transition shadow-sm active:scale-95"
            >
              {showNew ? 'Cancel' : <><Plus className="w-4 h-4 text-[#c88a23]" /> New Ticket</>}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-600 hover:underline">Dismiss</button>
          </div>
        )}

        {/* New Ticket Form Modal/Drawer */}
        {showNew && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200/80 p-6 sm:p-8 mb-8 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-black text-[#0f3e26] mb-1">Create Support Ticket</h2>
            <p className="text-xs text-gray-500 mb-6">
              Our support team will review your inquiry and respond as soon as possible.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={form.subject} 
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-[#0f3e26] focus:border-[#0f3e26] outline-none"
                    placeholder="e.g. Question about order delivery or ghee purity"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Order ID / Number (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={form.orderId} 
                    onChange={e => setForm({...form, orderId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-[#0f3e26] focus:border-[#0f3e26] outline-none font-mono"
                    placeholder="e.g. ORD-2026-1001 or order UUID"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">If your issue is related to an existing order, enter it here.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#0f3e26] outline-none font-medium"
                  >
                    <option value="low">Low (General Query)</option>
                    <option value="normal">Normal (Standard Assistance)</option>
                    <option value="high">High (Damaged / Delayed)</option>
                    <option value="urgent">Urgent (Immediate Attention)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Message Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    required 
                    rows={4} 
                    value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-1 focus:ring-[#0f3e26] focus:border-[#0f3e26] outline-none resize-none"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#c88a23]" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Support Tickets Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Need help with your orders, partner brands, or delivery? Click "New Ticket" above to reach our team.
              </p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 sm:p-6 transition hover:border-gray-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm text-gray-900">{ticket.subject}</h3>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>

                <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">{ticket.message}</p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-3 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </span>
                    {ticket.order_id && (
                      <span className="font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                        Order: {ticket.order_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-gray-400">
                    ID: {ticket.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
