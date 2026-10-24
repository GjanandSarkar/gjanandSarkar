export const CANCELLABLE_STATUSES = ['confirmed', 'out_for_delivery'] as const;

export function canCancelOrder(status: string | null | undefined): boolean {
  return !!status && (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}
