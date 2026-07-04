import React from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function NotificationEmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[24px] border border-sand my-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
        <BellRing className="w-8 h-8 opacity-50" />
      </div>
      <h3 className="text-base font-black text-dark mb-2">No Notifications Yet</h3>
      <p className="text-sm text-muted mb-6 max-w-[250px]">
        When you have order updates, delivery alerts, or special offers, they'll show up here.
      </p>
      <Button 
        onClick={() => router.push('/products')}
        className="rounded-full shadow-active px-8 font-bold"
      >
        Explore Products
      </Button>
    </div>
  );
}
