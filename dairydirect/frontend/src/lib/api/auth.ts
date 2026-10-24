import { api } from './client';
import { useStore, type User } from '@/store/useStore';

export async function logout(): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();

    // The session cookie is httpOnly, so JavaScript can no longer clear it.
    // Ask the server to expire both the access and refresh cookies.
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
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

    const parts = resolvedName.split(/\s+/);
    const firstName = profile.first_name || parts[0] || '';
    const lastName = profile.last_name || parts.slice(1).join(' ') || '';

    return {
      id: profile.id,
      name: resolvedName,
      first_name: firstName,
      last_name: lastName,
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

export async function updateProfileName(
  userId: string,
  firstNameOrName: string,
  lastNameParam?: string
): Promise<{ success: boolean; error?: string }> {
  let firstName: string;
  let lastName: string;
  let combinedName: string;

  if (lastNameParam !== undefined) {
    firstName = firstNameOrName.trim();
    lastName = lastNameParam.trim();
    combinedName = `${firstName} ${lastName}`.trim();
  } else {
    combinedName = firstNameOrName.trim();
    const parts = combinedName.split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        name: combinedName,
      }),
    });

    if (res.ok) {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        useStore.getState().setUser({
          ...currentUser,
          first_name: firstName,
          last_name: lastName,
          name: combinedName,
        });
      }
      return { success: true };
    }

    // Fallback to direct supabase
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      name: combinedName,
    }).eq('id', userId);

    if (error) {
      // Fallback with just name if first_name/last_name columns are not added yet
      const { error: retryError } = await supabase.from('profiles').update({ name: combinedName }).eq('id', userId);
      if (retryError) return { success: false, error: retryError.message };
    }
    
    const currentUser = useStore.getState().user;
    if (currentUser) {
      useStore.getState().setUser({
        ...currentUser,
        first_name: firstName,
        last_name: lastName,
        name: combinedName,
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { validatePhoneNumber } from '@/lib/utils/phone';

export async function updateProfilePhone(
  userId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const rawDigits = phone.replace(/\D/g, '');
  const fullPhone = phone.startsWith('+91') ? phone : `+91${rawDigits}`;
  const validRes = validatePhoneNumber(fullPhone);
  if (!validRes.isValid) {
    return { success: false, error: validRes.error || 'Enter a valid Indian mobile number' };
  }
  const onlyTenDigits = validRes.formatted.replace(/^\+91/, '');

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: onlyTenDigits }),
    });

    if (res.ok) {
      const currentUser = useStore.getState().user;
      if (currentUser) {
        useStore.getState().setUser({
          ...currentUser,
          phone: onlyTenDigits,
        });
      }
      return { success: true };
    }

    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('profiles').update({ phone: onlyTenDigits }).eq('id', userId);
    if (error) return { success: false, error: error.message };

    const currentUser = useStore.getState().user;
    if (currentUser) {
      useStore.getState().setUser({
        ...currentUser,
        phone: onlyTenDigits,
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