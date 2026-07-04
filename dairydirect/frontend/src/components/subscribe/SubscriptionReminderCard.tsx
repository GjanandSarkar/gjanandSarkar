import React from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function SubscriptionReminderCard() {
  const router = useRouter();

  return (
    <div className="bg-primary/5 rounded-[24px] p-5 mb-6 border border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
          <CalendarClock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-black text-dark leading-tight mb-1">
            Delivery Tomorrow Morning
          </h3>
          <p className="text-[12px] text-dark/80 font-medium mb-3">
            Your milk subscription is scheduled for delivery between 6:00 AM - 7:00 AM.
          </p>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/products')}
              className="bg-white hover:bg-sand rounded-full text-xs font-bold px-4 border-primary/20 text-primary"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Extra Items
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
