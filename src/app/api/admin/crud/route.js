import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateTable } from '@/lib/auth';

const FIELD_ALLOWLISTS = {
  courts: ['name', 'description', 'hourly_rate', 'surface_type', 'indoor', 'amenities', 'image_url', 'is_active'],
  time_slots: ['court_id', 'date', 'start_time', 'end_time', 'is_available', 'price_override'],
  bookings: ['user_id', 'court_id', 'date', 'time', 'total_price', 'status', 'payment_status', 'notes'],
  membership_tiers: ['name', 'description', 'monthly_price', 'annual_price', 'perks', 'discount_percent', 'is_active'],
  user_memberships: ['user_id', 'tier_id', 'status', 'start_date', 'end_date'],
  coaches: ['first_name', 'last_name', 'email', 'phone', 'specialization', 'hourly_rate', 'bio', 'avatar_url', 'is_active'],
  coach_bookings: ['user_id', 'coach_id', 'date', 'start_time', 'end_time', 'total_price', 'notes', 'status', 'payment_status'],
  tournaments: ['name', 'description', 'tournament_date', 'deadline', 'location', 'format', 'entry_fee', 'prize_pool', 'max_participants', 'level_min', 'level_max', 'rules', 'is_active'],
  tournament_registrations: ['tournament_id', 'user_id', 'team_name', 'partner_name', 'status'],
  shop_categories: ['name', 'description', 'image_url'],
  shop_products: ['name', 'description', 'price', 'discount_price', 'stock', 'category_id', 'brand', 'image_url', 'is_active'],
  shop_orders: ['user_id', 'total_amount', 'status', 'payment_status', 'shipping_address', 'notes'],
  shop_order_items: ['order_id', 'product_id', 'quantity', 'price'],
  vouchers: ['code', 'description', 'discount_type', 'discount_value', 'max_discount', 'min_amount', 'usage_limit', 'usage_count', 'valid_from', 'valid_until', 'is_active'],
  users: ['first_name', 'last_name', 'phone', 'avatar_url', 'role', 'padel_level'],
};

function pickAllowedFields(table, data) {
  const allowlist = FIELD_ALLOWLISTS[table];
  if (!allowlist) return null;
  const filtered = {};
  for (const key of allowlist) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  return filtered;
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { table, data } = body;

    if (!validateTable(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    if (table === 'users') {
      const { email, password, first_name, last_name, phone, role } = data;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name, phone }
      });
      if (authError) throw authError;
      const validRole = ['user', 'admin', 'coach'].includes(role) ? role : 'user';
      const { error: updateError } = await supabaseServer.from('users').update({ role: validRole }).eq('id', authData.user.id);
      if (updateError) throw updateError;
      return NextResponse.json({ success: true, data: authData.user });
    }

    const filtered = pickAllowedFields(table, data);
    if (!filtered || Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseServer.from(table).insert(filtered).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { table, id, data } = body;
    if (!table || !id || !data) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    if (!validateTable(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

    const filtered = pickAllowedFields(table, data);
    if (!filtered || Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseServer.from(table).update(filtered).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');
    if (!table || !id) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    if (!validateTable(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

    if (table === 'users') {
      const { error } = await supabaseServer.auth.admin.deleteUser(id);
      if (error) throw error;
    } else {
      const { error } = await supabaseServer.from(table).delete().eq('id', id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
