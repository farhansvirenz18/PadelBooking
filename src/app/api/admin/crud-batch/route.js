import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateTable } from '@/lib/auth';

const FIELD_ALLOWLISTS = {
  courts: ['name', 'description', 'type', 'price_per_hour_offpeak', 'price_per_hour_peak', 'amenities', 'image_url', 'status'],
  time_slots: ['court_id', 'date', 'start_time', 'end_time', 'is_available', 'price_override'],
  bookings: ['user_id', 'court_id', 'date', 'time', 'total_price', 'status', 'payment_status', 'notes'],
  coaches: ['first_name', 'last_name', 'email', 'phone', 'specialization', 'hourly_rate', 'bio', 'avatar_url', 'is_active'],
  shop_products: ['name', 'description', 'price', 'discount_price', 'stock', 'category_id', 'brand', 'image_url', 'is_active'],
  vouchers: ['code', 'description', 'discount_type', 'discount_value', 'max_discount', 'min_amount', 'usage_limit', 'usage_count', 'valid_from', 'valid_until', 'is_active'],
  tournaments: ['name', 'description', 'tournament_date', 'registration_deadline', 'format', 'entry_fee', 'prize_pool', 'max_participants', 'level_min', 'level_max', 'rules', 'status'],
};

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { table, filter, data } = body;
    if (!table || !filter || !data) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    if (!validateTable(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

    const allowlist = FIELD_ALLOWLISTS[table];
    if (!allowlist) return NextResponse.json({ error: 'Batch update not supported for this table' }, { status: 400 });

    const filtered = {};
    for (const key of allowlist) {
      if (data[key] !== undefined) filtered[key] = data[key];
    }
    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    if (!filter.id && Object.keys(filter).length === 0) {
      return NextResponse.json({ error: 'Filter must include at least one condition' }, { status: 400 });
    }

    let query = supabaseServer.from(table).update(filtered);
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
    const { error } = await query.select();
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Batch Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
