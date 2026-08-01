import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data, error } = await supabaseServer
      .from('bookings')
      .select('*, courts(name, type, location), time_slots(start_time, end_time, date, price, peak_price)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { courtId, timeSlotId, date } = await request.json();

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

    if (slot.status === 'booked' || slot.status === 'blocked') {
      return NextResponse.json({ error: 'Time slot is not available' }, { status: 400 });
    }

    const isPeak = slot.is_peak || false;
    const totalPrice = isPeak ? parseFloat(slot.peak_price) : parseFloat(slot.price);

    const { data: booking, error: bookingError } = await supabaseServer
      .from('bookings')
      .insert({
        user_id: auth.user.id,
        court_id: courtId,
        time_slot_id: timeSlotId,
        date: slot.date,
        total_price: totalPrice,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
