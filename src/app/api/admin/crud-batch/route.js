import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin, validateTable } from '@/lib/auth';

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { table, filter, data } = body;
    if (!table || !filter || !data) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    if (!validateTable(table)) return NextResponse.json({ error: 'Invalid table' }, { status: 400 });

    let query = supabaseServer.from(table).update(data);
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
