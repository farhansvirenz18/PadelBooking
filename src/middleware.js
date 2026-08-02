import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
