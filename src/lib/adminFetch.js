import { supabase } from '@/lib/supabaseClient';

// Helper to auto-attach auth header to admin API calls
export async function adminFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    window.location.href = '/login';
    throw new Error('Session expired, please log in again');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
  };

  // Don't override Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Session expired, please log in again');
  }

  return res;
}
