import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabaseServer
      .from('courts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Admin courts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { name, type, description, price_per_hour_offpeak, price_per_hour_peak, image_url, status, amenities } = body;

    if (!name || !type || !price_per_hour_offpeak) {
      return NextResponse.json({ error: 'name, type, and base price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('courts')
      .insert({
        name,
        type,
        description: description || null,
        price_per_hour_offpeak,
        price_per_hour_peak: price_per_hour_peak || price_per_hour_offpeak,
        image_url: image_url || null,
        status: status || 'active',
        amenities: amenities || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Admin court create error:', error);
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

    const allowedFields = ['name', 'type', 'description', 'price_per_hour_offpeak', 'price_per_hour_peak', 'image_url', 'status', 'amenities'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        filtered[key] = updateFields[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('courts')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (filtered.price_per_hour_offpeak !== undefined || filtered.price_per_hour_peak !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      
      await supabaseServer
        .from('time_slots')
        .update({ price: data.price_per_hour_offpeak })
        .eq('court_id', id)
        .eq('status', 'available')
        .gte('date', today)
        .eq('is_peak', false);
        
      await supabaseServer
        .from('time_slots')
        .update({ price: data.price_per_hour_peak })
        .eq('court_id', id)
        .eq('status', 'available')
        .gte('date', today)
        .eq('is_peak', true);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin court update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
