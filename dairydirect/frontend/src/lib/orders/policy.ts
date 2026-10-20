export const PERISHABLE = ['Milk', 'Curd', 'Paneer', 'Buttermilk', 'Butter', 'Sweets'];

export type Policy = {
  freshness_guarantee_hours: number;
  return_window_hours: number;
  replacement_window_hours: number;
};

export function windowHours(category: string, type: 'return' | 'replacement', p: Policy): number {
  if (PERISHABLE.includes(category)) return p.freshness_guarantee_hours ?? 24;
  return type === 'return' ? (p.return_window_hours ?? 168) : (p.replacement_window_hours ?? 168);
}

export const canCancel = (status: string): boolean =>
  ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(status);

export function itemActions(
  order: { status: string },
  item: {
    category: string;
    delivered_at: string | null;
    hasActiveRequest: boolean;
  },
  p: Policy
): { return: boolean; replace: boolean } {
  if (order.status !== 'delivered' || !item.delivered_at || item.hasActiveRequest) {
    return { return: false, replace: false };
  }
  const hoursSince = (Date.now() - new Date(item.delivered_at).getTime()) / 36e5;
  return {
    return: hoursSince <= windowHours(item.category, 'return', p),
    replace: hoursSince <= windowHours(item.category, 'replacement', p),
  };
}
