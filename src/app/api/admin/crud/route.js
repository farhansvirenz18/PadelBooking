import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateTable } from '@/lib/auth';

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
      const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name, phone }
      });
      if (authError) throw authError;
      const { error: updateError } = await supabaseServer.from('users').update({ role: role || 'user' }).eq('id', authData.user.id);
      if (updateError) throw updateError;
      return NextResponse.json({ success: true, data: authData.user });
    }

    const { data: inserted, error } = await supabaseServer.from(table).insert(data).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { data: updated, error } = await supabaseServer.from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
