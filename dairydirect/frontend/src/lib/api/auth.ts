import { api } from './client';
import { useStore, type User } from '@/store/useStore';

export async function logout(): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    // Clear cookies
    document.cookie = 'gs_access_token=; path=/; max-age=0';
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
      const fallbackName = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || (user.email ? user.email.split('@')[0] : 'Customer');

      return {
        id: user.id,
        name: fallbackName,
        phone: user.phone || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: 'customer',
      };
    }

    const raw = await res.json();
    const profile = raw.user || raw.data?.user;
    if (!profile) {
      const fallbackName = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || (user.email ? user.email.split('@')[0] : 'Customer');

      return {
        id: user.id,
        name: fallbackName,
        phone: user.phone || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: 'customer',
      };
    }

    const resolvedName = (profile.name && profile.name.trim()) 
      ? profile.name.trim() 
      : (user.user_metadata?.full_name || user.user_metadata?.name || (profile.email ? profile.email.split('@')[0] : 'Customer'));

    return {
      id: profile.id,
      name: resolvedName,
      phone: profile.phone || '',
      email: profile.email || '',
      avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      role: profile.role ?? 'customer',
      saved_addresses: profile.saved_addresses || [],
    };
  } catch {
    return null;
  }
}

export async function updateProfileNames(
  userId: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string }> {
  if (/\d/.test(firstName) || /\d/.test(lastName)) {
    return { success: false, error: 'Name cannot contain numbers.' };
  }
  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();
  if (!cleanFirst || !cleanLast) {
    return { success: false, error: 'Please enter both First Name and Last Name.' };
  }
  const fullName = `${cleanFirst} ${cleanLast}`.trim();

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: cleanFirst, last_name: cleanLast, name: fullName }),
    });

    if (res.ok) {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        useStore.getState().setUser({
          ...currentUser,
          first_name: cleanFirst,
          last_name: cleanLast,
          name: fullName,
        });
      }
      return { success: true };
    }

    const errJson = await res.json().catch(() => ({}));
    if (errJson.error) return { success: false, error: errJson.error };

    // Fallback to direct supabase
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({
      first_name: cleanFirst,
      last_name: cleanLast,
      name: fullName,
    }).eq('id', userId);

    if (error) return { success: false, error: error.message };

    // Also update users table in Supabase
    try {
      await supabase.from('users').update({
        first_name: cleanFirst,
        last_name: cleanLast,
        name: fullName,
      }).eq('id', userId);
    } catch {}
    const currentUser = useStore.getState().user;
    if (currentUser) {
      useStore.getState().setUser({
        ...currentUser,
        first_name: cleanFirst,
        last_name: cleanLast,
        name: fullName,
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProfileName(
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (/\d/.test(name)) {
    return { success: false, error: 'Name cannot contain numbers.' };
  }
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return updateProfileNames(userId, firstName, lastName);
}

export async function updateProfilePhone(
  userId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone }),
    });

    if (res.ok) {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        useStore.getState().setUser({
          ...currentUser,
          phone: cleanPhone,
        });
      }
      return { success: true };
    }

    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', userId);
    if (error) return { success: false, error: error.message };

    // Also update users table
    try {
      await supabase.from('users').update({ phone }).eq('id', userId);
    } catch {}

    const currentUser = useStore.getState().user;
    if (currentUser) {
      useStore.getState().setUser({
        ...currentUser,
        phone,
      });
    }
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
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });

    if (res.ok) {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        useStore.getState().setUser({
          ...currentUser,
          avatar_url: avatarUrl,
        });
      }
      return { success: true };
    }

    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) return { success: false, error: error.message };

    const currentUser = useStore.getState().user;
    if (currentUser) {
      useStore.getState().setUser({
        ...currentUser,
        avatar_url: avatarUrl,
      });
    }
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