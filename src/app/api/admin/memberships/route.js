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
      .order('monthly_price', { ascending: true });

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
      name, description, monthly_price, perks,
      discount_percent, priority_booking_days, free_credits, is_active,
    } = body;

    if (!name || !monthly_price) {
      return NextResponse.json({ error: 'name and monthly_price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('membership_tiers')
      .insert({
        name,
        description: description || null,
        monthly_price,
        discount_percent: discount_percent || 0,
        priority_booking_days: priority_booking_days || 0,
        free_credits: free_credits || 0,
        perks: perks || '{}',
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

    const allowedFields = ['name', 'description', 'monthly_price', 'perks', 'discount_percent', 'priority_booking_days', 'free_credits', 'is_active'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) filtered[key] = updateFields[key];
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

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
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin membership delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
