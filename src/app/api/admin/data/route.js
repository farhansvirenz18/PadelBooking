import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateTable } from '@/lib/auth';

const ALLOWED_TABLES = ['users', 'courts', 'time_slots', 'bookings', 'coaches', 'coach_bookings', 'tournaments', 'tournament_registrations', 'memberships', 'user_memberships', 'membership_tiers', 'shop_products', 'shop_orders', 'vouchers'];

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table) return NextResponse.json({ error: 'Missing table parameter' }, { status: 400 });
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    let query = supabaseServer.from(table).select('*');

    if (table === 'bookings') {
      query = supabaseServer.from(table).select('*, users(email, first_name, last_name), courts(name, type)');
    } else if (table === 'coach_bookings') {
      query = supabaseServer.from(table).select('*, users(email, first_name, last_name), coaches(first_name, last_name)');
    } else if (table === 'tournament_registrations') {
      query = supabaseServer.from(table).select('*, users(email, first_name, last_name), tournaments(name)');
    } else if (table === 'shop_orders') {
      query = supabaseServer.from(table).select('*, users(email, first_name, last_name)');
    } else if (table === 'user_memberships') {
      query = supabaseServer.from(table).select('*, users(email, first_name, last_name), membership_tiers(name, price)');
    }

    if (id) {
      const { data, error } = await query.eq('id', id).single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
