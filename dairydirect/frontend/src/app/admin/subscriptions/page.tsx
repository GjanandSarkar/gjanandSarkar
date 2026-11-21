"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { Repeat, Loader2, CheckCircle2, PauseCircle, XCircle, Play } from 'lucide-react';
import { getAllSubscriptions, pauseSubscription, cancelSubscription } from '@/lib/api/subscriptions';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  'active': { bg: '#dcfce7', color: '#15803d', icon: CheckCircle2 },
  'paused': { bg: '#fef3c7', color: '#b45309', icon: PauseCircle },
  'cancelled': { bg: '#fee2e2', color: '#b91c1c', icon: XCircle },
};

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    const data = await getAllSubscriptions();
    setSubscriptions(data);
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setIsUpdating(id);
    const result = await pauseSubscription(id, currentStatus);
    if (result.success) {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: currentStatus === 'paused' ? 'active' : 'paused' } : s));
    }
    setIsUpdating(null);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    setIsUpdating(id);
    const result = await cancelSubscription(id);
    if (result.success) {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    }
    setIsUpdating(null);
  };

  const filtered = activeTab === 'all' ? subscriptions : subscriptions.filter(s => s.status === activeTab);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Subscriptions"
        subtitle={`${filtered.length} recurring delivery customer orders`}
        onRefresh={loadSubscriptions}
        isRefreshing={isLoading}
      >
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {['all', 'active', 'paused', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-muted text-foreground hover:bg-border/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </AdminHeader>

      <div className="px-6 md:px-10 py-6">
        <AdminTable
          columns={[
            { header: 'Product & Plan' },
            { header: 'Customer' },
            { header: 'Volume' },
            { header: 'Start Date' },
            { header: 'Next Delivery' },
            { header: 'Status' },
            { header: 'Actions', align: 'right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && filtered.length === 0}
          emptyIcon={Repeat}
          emptyTitle="No subscriptions found"
          emptyDescription="Customer subscription orders will appear here once scheduled."
        >
          {filtered.map((sub) => {
            const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES['cancelled'];
            const StatusIcon = statusStyle.icon;

            return (
              <tr
                key={sub.id}
                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[13px] text-foreground">
                        {sub.products?.name || 'Dairy Product'}
                      </p>
                      <p className="text-xs text-foreground-muted capitalize">
                        {sub.plan === 'weekly' ? 'Weekly Delivery Plan' : `${sub.plan} Plan`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">
                  {sub.profiles?.name || sub.user_id?.slice(0, 8)}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">
                  {sub.volume} {t('volume_unit') || 'L'}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground-muted">
                  {sub.start_date ? format(new Date(sub.start_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                  {sub.next_delivery_date ? format(new Date(sub.next_delivery_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{sub.status}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {sub.status !== 'cancelled' && (
                      <button
                        onClick={() => handleToggleStatus(sub.id, sub.status)}
                        disabled={isUpdating === sub.id}
                        className="px-2.5 py-1.5 rounded-lg border border-border/80 text-xs font-semibold hover:bg-surface-muted transition-colors cursor-pointer text-foreground flex items-center gap-1"
                        title={sub.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
                      >
                        {sub.status === 'paused' ? <Play className="w-3 h-3 text-primary" /> : <PauseCircle className="w-3 h-3 text-amber-600" />}
                        <span>{sub.status === 'paused' ? 'Resume' : 'Pause'}</span>
                      </button>
                    )}
                    {sub.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(sub.id)}
                        disabled={isUpdating === sub.id}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="Cancel Subscription"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>
    </div>
  );
}
