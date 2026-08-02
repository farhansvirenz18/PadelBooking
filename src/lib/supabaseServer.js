import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { ALLOWED_TABLES } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export function createServerClientWithCookies(cookieStore) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function fetchTableServer(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    console.error(`fetchTableServer: invalid table "${table}"`);
    return [];
  }
  const { data, error } = await supabaseServer.from(table).select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(`Supabase fetch error for ${table}:`, error);
    return [];
  }
  return data;
}
