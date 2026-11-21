import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SubscriptionHub } from '@/components/subscribe/SubscriptionHub';
import { getPlansForUser, getSessionUser } from '@/lib/subscriptions/server';

export const metadata: Metadata = {
  title: 'My milk plan',
  description: 'Pause, skip or change your daily dairy subscription. No lock-in, pay per delivery.',
};

// Personalised, auth-scoped data: never cache at the edge.
export const dynamic = 'force-dynamic';

export default async function SubscriptionHubPage() {
  const session = await getSessionUser();
  if (!session) redirect('/login?redirect=%2Fsubscribe');

<<<<<<< HEAD
  const plans = await getPlansForUser(session.userId);

  return <SubscriptionHub initialPlans={plans} />;
=======
  const loadSubs = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getUserSubscriptions(user.id);
    setSubs(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const handlePauseToggle = async (sub: SubscriptionWithProduct) => {
    const result = await pauseSub(sub.id, sub.status);
    if (result.success) {
      const newStatus = sub.status === 'paused' ? 'active' : 'paused';
      setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: newStatus as any } : s));
    } else {
      alert(result.error || 'Failed to update subscription status.');
    }
  };

  const handleCancel = async (sub: SubscriptionWithProduct) => {
    const result = await cancelSub(sub.id);
    if (result.success) {
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    } else {
      alert(result.error || 'Failed to cancel subscription.');
    }
  };

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  const activeSubscriptions = subs.filter(s => s.status === 'active');

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background text-foreground transition-colors duration-150">
      {/* Standardized Page Header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('mySubscriptions') || 'My Subscriptions'}
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({subs.length})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Manage recurring morning dairy deliveries and scheduled staples
            </p>
          </div>
          <Link href="/subscribe/new" className="self-start sm:self-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all active:scale-95 bg-primary hover:bg-primary-hover shadow-xs cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>New Plan</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full">
        {subs.length > 0 ? (
          <>
            <SubscriptionReminderCard />
            <UpcomingDeliveries activeSubscriptions={activeSubscriptions} />

            <div className="space-y-4">
              {subs.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onPauseToggle={handlePauseToggle}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-border shadow-xs max-w-xl mx-auto p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
              <Plus className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Never run out of morning essentials
            </h2>
            <p className="text-xs max-w-sm leading-relaxed text-foreground-muted">
              Subscribe once and your regulars arrive on schedule — pure A2 milk, bilona ghee, and farm-fresh staples.
            </p>
            <Link href="/products">
              <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer">
                Explore Subscription Products
              </button>
            </Link>
            
            <div className="w-full text-left pt-6 border-t border-border/60">
              <h3 className="text-sm font-bold text-foreground mb-3 px-1">Popular for Daily Delivery</h3>
              <BuyAgainCarousel />
            </div>
          </div>
        )}

        {/* Trust Module */}
        <SubscriptionConfidence />
      </div>
    </div>
  );
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
}
