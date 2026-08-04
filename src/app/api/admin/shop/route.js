import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (type === 'categories') {
      let query = supabaseServer
        .from('shop_categories')
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) query = query.eq('is_active', true);

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data: data || [] });
    }

    let query = supabaseServer
      .from('shop_products')
      .select('*, shop_categories(name, id)')
      .order('created_at', { ascending: false });

    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Admin shop fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { type, ...payload } = body;

    if (type === 'category') {
      const { name, slug, icon, sort_order } = payload;
      if (!name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }

      const { data, error } = await supabaseServer
        .from('shop_categories')
        .insert({
          name,
          slug: slug || null,
          icon: icon || null,
          sort_order: sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const { name, description, price, stock, category_id, image_url, brand, discount_price, is_active } = payload;
    if (!name || !price) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('shop_products')
      .insert({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category_id: category_id || null,
        image_url: image_url || null,
        brand: brand || null,
        discount_price: discount_price || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Admin shop create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { type, id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (type === 'category') {
      const allowedFields = ['name', 'slug', 'icon', 'sort_order'];
      const filtered = {};
      for (const key of allowedFields) {
        if (updateFields[key] !== undefined) filtered[key] = updateFields[key];
      }
      if (Object.keys(filtered).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      const { data, error } = await supabaseServer
        .from('shop_categories')
        .update(filtered)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const allowedFields = ['name', 'description', 'price', 'stock', 'category_id', 'image_url', 'brand', 'discount_price', 'is_active'];
    const filtered = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) filtered[key] = updateFields[key];
    }
    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('shop_products')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin shop update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    let type = searchParams.get('type');
    let id = searchParams.get('id');
    if (!id || !type) {
      try {
        const body = await request.json();
        if (!id) id = body.id;
        if (!type) type = body.type;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (type === 'category') {
      const { error } = await supabaseServer
        .from('shop_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseServer
        .from('shop_products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin shop delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
