import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;

    const { data: booking, error } = await supabaseServer
      .from('bookings')
      .select('*, courts(name, type, location, image_url), time_slots(start_time, end_time, date, price, peak_price), users(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.user_id !== auth.user.id) {
      const { data: adminCheck } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .single();
      if (adminCheck?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Booking detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: booking, error: lookupError } = await supabaseServer
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (lookupError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.user_id !== auth.user.id) {
      const { data: adminCheck } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .single();
      if (adminCheck?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }

    const { error: cancelError } = await supabaseServer
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'cancelled' })
      .eq('id', id);

    if (cancelError) throw cancelError;

    if (booking.time_slot_id) {
      await supabaseServer
        .from('time_slots')
        .update({ status: 'available' })
        .eq('id', booking.time_slot_id);
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Booking cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
