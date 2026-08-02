import { supabase } from '@/lib/supabaseClient';

export async function userFetch(url, options = {}) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error in userFetch:', sessionError);
      window.location.href = '/login';
      throw new Error('Authentication error');
    }

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
  } catch (err) {
    if (err.message?.includes('log in again') || err.message?.includes('Authentication error')) {
      throw err;
    }
    console.error('userFetch network error:', err);
    throw new Error('Network error. Please check your connection.');
  }
}
