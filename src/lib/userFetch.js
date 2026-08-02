import { supabase } from '@/lib/supabaseClient';

export async function userFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    window.location.href = '/login';
    throw new Error('Session expired, please log in again');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
  };

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
