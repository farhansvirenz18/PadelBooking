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
      name, bio, image_url, specialties, certifications, hourly_rate, is_active,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const certs = Array.isArray(certifications)
      ? certifications
      : typeof certifications === 'string' && certifications.trim()
        ? certifications.split(',').map(s => s.trim()).filter(Boolean)
        : null;

    const insertData = {
      name,
      bio: bio || null,
      image_url: image_url || null,
      specialties: Array.isArray(specialties) ? specialties : null,
      certifications: certs,
      hourly_rate: hourly_rate || 0,
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

    const allowedFields = ['name', 'bio', 'hourly_rate', 'image_url', 'is_active', 'specialties', 'certifications'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        filtered[key] = updateFields[key];
      }
    }

    if (filtered.certifications !== undefined) {
      filtered.certifications = Array.isArray(filtered.certifications)
        ? filtered.certifications
        : typeof filtered.certifications === 'string' && filtered.certifications.trim()
          ? filtered.certifications.split(',').map(s => s.trim()).filter(Boolean)
          : null;
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

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
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin coach delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
