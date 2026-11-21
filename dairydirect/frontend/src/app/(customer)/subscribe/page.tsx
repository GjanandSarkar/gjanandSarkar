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

  const plans = await getPlansForUser(session.userId);

  return <SubscriptionHub initialPlans={plans} />;
}
