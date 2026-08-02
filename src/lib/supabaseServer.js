import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function fetchTableServer(table) {
  const { data, error } = await supabaseServer.from(table).select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(`Supabase fetch error for ${table}:`, error);
    return [];
  }
  return data;
}
