import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('coaches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Admin coaches fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const {
      name, first_name, last_name, email, phone, specialization, hourly_rate,
      bio, image_url, image, specialties, certifications, is_active,
    } = body;

    const resolvedFirstName = first_name || (name ? name.split(' ')[0] : null);
    const resolvedLastName = last_name || (name ? name.split(' ').slice(1).join(' ') : null);

    if (!resolvedFirstName) {
      return NextResponse.json({ error: 'first_name or name is required' }, { status: 400 });
    }

    const insertData = {
      first_name: resolvedFirstName,
      last_name: resolvedLastName || null,
      email: email || null,
      phone: phone || null,
      specialization: specialization || (Array.isArray(specialties) ? specialties[0] : null),
      hourly_rate: hourly_rate || 0,
      bio: bio || null,
      image_url: image_url || null,
      specialties: Array.isArray(specialties) ? specialties : null,
      certifications: certifications || null,
      is_active: is_active !== undefined ? is_active : true,
    };

    const { data, error } = await supabaseServer
      .from('coaches')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Admin coach create error:', error);
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

    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'specialization', 'hourly_rate', 'bio', 'image_url', 'is_active', 'specialties', 'certifications'];
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
      .from('coaches')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin coach update error:', error);
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
      .from('coaches')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin coach delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
