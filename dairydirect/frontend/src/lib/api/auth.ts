import { api } from './client';
import type { User } from '@/store/useStore';

export async function logout(): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Sync with backend to get profile
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.access_token }),
    });

    if (!res.ok) {
      return {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.phone || '',
        email: user.email || '',
        role: 'customer',
      };
    }

    const { data } = await res.json();
    const profile = data.user;
    return {
      id: profile.id,
      name: profile.name ?? '',
      phone: profile.phone || '',
      email: profile.email || '',
      role: profile.role ?? 'customer',
    };
  } catch {
    return null;
  }
}

export async function updateProfileName(
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllProfiles(): Promise<any[]> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('getAllProfiles error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getAllProfiles exception:', err);
    return [];
  }
}