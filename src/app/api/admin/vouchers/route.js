import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Admin vouchers fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const {
      code, description, discount_type, discount_value,
      min_amount, min_purchase, max_discount, usage_limit, max_uses,
      valid_from, valid_until,
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'code, discount_type, and discount_value are required' }, { status: 400 });
    }

    const normalizedType = discount_type === 'percent' ? 'percentage' : discount_type;

    if (!['percentage', 'fixed'].includes(normalizedType)) {
      return NextResponse.json({ error: 'discount_type must be percentage or fixed' }, { status: 400 });
    }

    const { data: existing } = await supabaseServer
      .from('vouchers')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Voucher code already exists' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('vouchers')
      .insert({
        code: code.toUpperCase(),
        description: description || null,
        discount_type: normalizedType,
        discount_value,
        min_amount: min_amount || min_purchase || null,
        max_discount: max_discount || null,
        usage_limit: usage_limit || max_uses || null,
        usage_count: 0,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Admin voucher create error:', error);
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

    const allowedFields = [
      'code', 'description', 'discount_type', 'discount_value',
      'min_amount', 'min_purchase', 'max_discount', 'usage_limit', 'max_uses',
      'valid_from', 'valid_until', 'is_active',
    ];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        filtered[key] = key === 'code' ? updateFields[key].toUpperCase() : updateFields[key];
      }
    }

    if (filtered.discount_type === 'percent') filtered.discount_type = 'percentage';
    if (filtered.min_purchase) { filtered.min_amount = filtered.min_purchase; delete filtered.min_purchase; }
    if (filtered.max_uses) { filtered.usage_limit = filtered.max_uses; delete filtered.max_uses; }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('vouchers')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin voucher update error:', error);
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
      .from('vouchers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin voucher delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
