import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: court, error: courtError } = await supabaseServer
      .from('courts')
      .select('*')
      .eq('id', id)
      .single();

    if (courtError || !court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const { data: slots } = await supabaseServer
      .from('time_slots')
      .select('id, status, start_time, end_time, date, price')
      .eq('court_id', id)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    const totalSlots = (slots || []).length;
    const bookedSlots = (slots || []).filter(s => s.status === 'booked').length;
    const availableSlots = totalSlots - bookedSlots;

    return NextResponse.json({
      success: true,
      data: {
        ...court,
        availability: {
          totalSlots,
          bookedSlots,
          availableSlots,
          utilization: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Court detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
