import { supabase } from '@/lib/supabase';
import type { DBNotification } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export type CreateNotificationInput = {
  userId: string | null;       // null = broadcast
  roleTarget: 'customer' | 'admin' | 'all';
  title: string;
  body: string;
  type?: DBNotification['type'];
  relatedId?: string;
};

// ─── Get Notifications for User ──────────────────────────────
export async function getNotifications(
  userId: string,
  userRole: 'customer' | 'admin'
): Promise<DBNotification[]> {
  // Fetch personal + broadcast notifications for this role
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(
      `user_id.eq.${userId},` +
      `and(user_id.is.null,role_target.eq.${userRole}),` +
      `and(user_id.is.null,role_target.eq.all)`
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('getNotifications error:', error.message, '| Detail:', error.details, '| Hint:', error.hint);
    return [];
  }

  return (data as DBNotification[]) ?? [];
}

// ─── Get Unread Count ─────────────────────────────────────────
export async function getUnreadCount(
  userId: string,
  userRole: 'customer' | 'admin'
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .or(
      `user_id.eq.${userId},` +
      `and(user_id.is.null,role_target.eq.${userRole}),` +
      `and(user_id.is.null,role_target.eq.all)`
    )
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

// ─── Mark Notification as Read ───────────────────────────────
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// ─── Mark All Read for User ───────────────────────────────────
export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

// ─── Create Notification (server/admin side) ──────────────────
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    role_target: input.roleTarget,
    title: input.title,
    message: input.body,
    type: input.type ?? 'system',
    related_id: input.relatedId ?? null,
    is_read: false,
  });

  if (error) {
    console.error('createNotification error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Subscribe to Realtime Notifications ─────────────────────
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: DBNotification) => void
) {
  // Guard: If userId is not a valid UUID (e.g. still a raw Firebase UID),
  // skip subscription to avoid Postgres syntax errors in Realtime.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    console.debug('[Realtime] Skipping sub: user.id is not a UUID yet');
    return () => {};
  }

  // Generate a unique suffix for this specific subscription instance.
  // This prevents conflicts if multiple NotificationBells (e.g. Sidebar + TopAppBar) 
  // are mounted simultaneously for the same user.
  const instanceId = Math.random().toString(36).substring(2, 8);
  const channel = supabase.channel(`notifs-${userId}-${instanceId}`);
  
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        onNew(payload.new as DBNotification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
