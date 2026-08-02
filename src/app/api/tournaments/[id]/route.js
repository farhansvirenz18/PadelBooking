import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: tournament, error } = await supabaseServer
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const { data: registrations } = await supabaseServer
      .from('tournament_registrations')
      .select('id, user_id, registered_at, status, payment_status, users(first_name, last_name, email)')
      .eq('tournament_id', id)
      .order('registered_at', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...tournament,
        registrations: registrations || [],
        registeredCount: (registrations || []).length,
      },
    });
  } catch (error) {
    console.error('Tournament detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
