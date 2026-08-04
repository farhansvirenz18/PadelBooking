import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('bookings')
      .select('*, courts(name, type), time_slots(start_time, end_time, date, price), coaches(name)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { courtId, timeSlotId, coachId } = await request.json();

    if (!courtId || !timeSlotId) {
      return NextResponse.json({ error: 'courtId and timeSlotId are required' }, { status: 400 });
    }

    const { data: slot, error: slotError } = await supabaseServer
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .eq('court_id', courtId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });
    }

    const { data: reserved, error: reserveError } = await supabaseServer
      .from('time_slots')
      .update({ status: 'booked' })
      .eq('id', timeSlotId)
      .eq('status', 'available')
      .select()
      .single();

    if (reserveError || !reserved) {
      return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 400 });
    }

    let totalPrice = parseFloat(slot.price) || 0;

    if (coachId) {
      const { data: coach } = await supabaseServer
        .from('coaches')
        .select('hourly_rate')
        .eq('id', coachId)
        .single();
      
      if (coach && coach.hourly_rate) {
        totalPrice += parseFloat(coach.hourly_rate);
      }
    }

    const { data: booking, error: bookingError } = await supabaseServer
      .from('bookings')
      .insert({
        user_id: auth.user.id,
        court_id: courtId,
        coach_id: coachId || null,
        time_slot_id: timeSlotId,
        booking_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        total_price: totalPrice,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (bookingError) {
      await supabaseServer.from('time_slots').update({ status: 'available' }).eq('id', timeSlotId);
      throw bookingError;
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
