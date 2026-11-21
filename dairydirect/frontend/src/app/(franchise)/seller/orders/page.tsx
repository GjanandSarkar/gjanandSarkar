"use client";

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { PageShell } from '@/components/franchise/PageShell';
import { SellerOrdersManager } from '@/components/seller/SellerOrdersManager';
import { Button } from '@/components/ui/Button';

export default function SellerOrdersDedicatedPage() {
  return (
    <PageShell
      title="Order Management"
      subtitle="Track customer purchases, advance fulfillment milestones (Confirmed → Out for Delivery → Delivered), and handle cancellations."
      actions={
        <Link href="/seller/dashboard">
          <Button variant="outline" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
            Console Overview
          </Button>
        </Link>
      }
    >
      <SellerOrdersManager />
    </PageShell>
  );
}
