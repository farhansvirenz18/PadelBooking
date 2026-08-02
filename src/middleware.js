import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_API_ROUTES = [
  '/api/courts',
  '/api/coaches',
  '/api/tournaments',
  '/api/shop/products',
  '/api/shop/categories',
  '/api/vouchers/validate',
  '/api/payments/webhook',
];

const PUBLIC_PAGES = [
  '/',
  '/login',
  '/register',
  '/courts',
  '/coaches',
  '/tournaments',
  '/shop',
  '/membership',
  '/auth/callback',
];

function isPublicRoute(pathname) {
  if (PUBLIC_PAGES.includes(pathname)) return true;
  if (PUBLIC_PAGES.some(p => pathname.startsWith(p + '/'))) return true;
  if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) return true;
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (pathname.startsWith('/api/')) {
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    supabaseResponse.headers.set('x-user-id', user.id);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
