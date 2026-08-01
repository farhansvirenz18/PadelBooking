import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: coach, error } = await supabaseServer
      .from('coaches')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    const { data: bookings } = await supabaseServer
      .from('coach_bookings')
      .select('id, date, start_time, end_time, status')
      .eq('coach_id', id)
      .eq('status', 'confirmed')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        ...coach,
        upcomingBookings: bookings || [],
      },
    });
  } catch (error) {
    console.error('Coach detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
