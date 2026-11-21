import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PlanBuilder } from '@/components/subscribe/PlanBuilder';
import { getAddressesForUser, getPlanCatalogue, getSessionUser } from '@/lib/subscriptions/server';

export const metadata: Metadata = {
  title: 'Start a milk plan',
  description: 'Choose your milk, quantity and delivery days. Fresh dairy at your door before breakfast.',
};

export const dynamic = 'force-dynamic';

export default async function NewSubscriptionPage() {
  const session = await getSessionUser();
  if (!session) redirect('/login?redirect=%2Fsubscribe%2Fnew');

  const [products, addresses] = await Promise.all([
    getPlanCatalogue(),
    getAddressesForUser(session.userId),
  ]);

  return <PlanBuilder products={products} addresses={addresses} />;
}
