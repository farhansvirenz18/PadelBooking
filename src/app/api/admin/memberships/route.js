import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('membership_tiers')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Admin memberships fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const {
      name, description, price, monthly_price, duration_months, benefits, perks,
      max_bookings_per_month, discount_percent, priority_booking_days, free_credits, is_active,
    } = body;

    const resolvedPrice = price || monthly_price;

    if (!name || !resolvedPrice) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('membership_tiers')
      .insert({
        name,
        description: description || null,
        price: resolvedPrice,
        duration_months: duration_months || 1,
        benefits: benefits || perks || null,
        max_bookings_per_month: max_bookings_per_month || null,
        discount_percent: discount_percent || null,
        priority_booking_days: priority_booking_days || null,
        free_credits: free_credits || null,
        perks: perks || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Admin membership create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowedFields = ['name', 'description', 'price', 'monthly_price', 'duration_months', 'benefits', 'perks', 'max_bookings_per_month', 'discount_percent', 'priority_booking_days', 'free_credits', 'is_active'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) filtered[key] = updateFields[key];
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('membership_tiers')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin membership update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try { const body = await request.json(); id = body.id; } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('membership_tiers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin membership delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
