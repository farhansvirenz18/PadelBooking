import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const { data: court, error: courtError } = await supabaseServer
      .from('courts')
      .select('id, name, type, status')
      .eq('id', id)
      .single();

    if (courtError || !court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const { data: slots, error: slotsError } = await supabaseServer
      .from('time_slots')
      .select('*')
      .eq('court_id', id)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (slotsError) throw slotsError;

    return NextResponse.json({
      success: true,
      data: {
        court: {
          id: court.id,
          name: court.name,
          type: court.type,
        },
        date,
        slots: slots || [],
      },
    });
  } catch (error) {
    console.error('Slots fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
