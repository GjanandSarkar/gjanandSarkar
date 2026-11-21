/** Shapes shared by the subscription hub, the plan builder and the API. */

import type { PlanCadence } from './schedule';

export interface PlanProductVariant {
  id: string;
  weight: string;
  price: number;
  originalPrice?: number | null;
  availableQuantity: number;
}

export interface PlanProduct {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  imageUrl?: string | null;
  variants: PlanProductVariant[];
}

export interface SubscriptionPlan {
  id: string;
  status: 'active' | 'paused' | 'cancelled' | 'pending_review';
  plan: PlanCadence;
  volume: number;
  deliverySlot: string;
  startDate: string;
  nextDeliveryDate: string;
  product: { id: string; name: string; category: string; imageUrl?: string | null };
  variant: { id: string; weight: string; price: number } | null;
}

export interface PlanAddress {
  id: string;
  label: string;
  line: string;
  isDefault: boolean;
}
