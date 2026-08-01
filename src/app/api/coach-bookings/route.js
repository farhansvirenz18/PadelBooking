import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('coach_bookings')
      .select('*, coaches(first_name, last_name, specialization, hourly_rate)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Coach bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { coachId, date, startTime, endTime, notes } = await request.json();

    if (!coachId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'coachId, date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const { data: coach, error: coachError } = await supabaseServer
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .eq('is_active', true)
      .single();

    if (coachError || !coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    const { data: conflict } = await supabaseServer
      .from('coach_bookings')
      .select('id')
      .eq('coach_id', coachId)
      .eq('date', date)
      .eq('status', 'confirmed')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (conflict && conflict.length > 0) {
      return NextResponse.json({ error: 'Coach is not available at this time' }, { status: 400 });
    }

    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const hours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
    const totalPrice = hours * parseFloat(coach.hourly_rate);

    const { data: booking, error: bookingError } = await supabaseServer
      .from('coach_bookings')
      .insert({
        user_id: auth.user.id,
        coach_id: coachId,
        date,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Coach booking creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
