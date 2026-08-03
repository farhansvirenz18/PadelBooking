import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.includes('://') ? next : '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from Server Component where set is not allowed
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();

        const googleFirstName = user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || '';
        const googleLastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '';
        const googleAvatar = user.user_metadata?.avatar_url || null;

        if (!existing) {
          await supabaseAdmin.from('users').insert({
            id: user.id,
            email: user.email,
            first_name: googleFirstName,
            last_name: googleLastName,
            avatar_url: googleAvatar,
            role: 'user',
          });
        } else if (!existing.first_name && googleFirstName) {
          await supabaseAdmin.from('users').update({
            first_name: googleFirstName,
            last_name: googleLastName,
            avatar_url: existing.avatar_url || googleAvatar,
          }).eq('id', user.id);
        }

        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const redirectPath = profile?.role === 'admin' ? '/admin' : `${safeNext}?login=true`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }

    console.error('exchangeCodeForSession error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
