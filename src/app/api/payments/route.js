import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com/snap/v1/transactions'
  : 'https://api.sandbox.midtrans.com/snap/v1/transactions';

const TABLE_MAP = {
  booking: 'bookings',
  coach_booking: 'coach_bookings',
  tournament: 'tournament_registrations',
  shop_order: 'shop_orders',
  membership: 'user_memberships',
};

function generateOrderId(type, id) {
  const prefix = {
    booking: 'BK',
    coach_booking: 'CB',
    tournament: 'TR',
    shop_order: 'SO',
    membership: 'MB',
  };
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix[type]}${Date.now()}${id.slice(0, 4).toUpperCase()}${rand}`;
}

async function lookupRecord(type, recordId) {
  const table = TABLE_MAP[type];
  if (!table) return { error: 'Invalid payment type' };

  const { data, error } = await supabaseServer
    .from(table)
    .select('*')
    .eq('id', recordId)
    .single();

  if (error || !data) return { error: 'Record not found' };
  return { data, table };
}

async function buildPayload(type, record) {
  let amount, itemName, customerName, customerEmail, customerPhone;

  if (type === 'booking') {
    const { data: court } = await supabaseServer
      .from('courts')
      .select('name')
      .eq('id', record.court_id)
      .single();
    const { data: timeSlot } = await supabaseServer
      .from('time_slots')
      .select('start_time, end_time')
      .eq('id', record.time_slot_id)
      .single();
    amount = record.total_price;
    itemName = `Booking - ${court?.name || 'Court'}`;
  } else if (type === 'coach_booking') {
    const { data: coach } = await supabaseServer
      .from('coaches')
      .select('first_name, last_name')
      .eq('id', record.coach_id)
      .single();
    amount = record.total_price;
    itemName = `Coach Booking - ${coach?.first_name || ''} ${coach?.last_name || ''}`;
  } else if (type === 'tournament') {
    const { data: tournament } = await supabaseServer
      .from('tournaments')
      .select('name, entry_fee')
      .eq('id', record.tournament_id)
      .single();
    amount = tournament?.entry_fee || 0;
    itemName = `Tournament Entry - ${tournament?.name || 'Tournament'}`;
  } else if (type === 'shop_order') {
    amount = record.total_price;
    itemName = `Shop Order #${record.id.slice(0, 8)}`;
  } else if (type === 'membership') {
    const { data: tier } = await supabaseServer
      .from('membership_tiers')
      .select('name, monthly_price')
      .eq('id', record.tier_id)
      .single();
    amount = tier?.monthly_price || 0;
    itemName = `Membership - ${tier?.name || 'Tier'}`;
  }

  if (!amount || amount <= 0) {
    return { error: 'Invalid payment amount' };
  }

  if (itemName && itemName.length > 50) {
    itemName = itemName.substring(0, 50);
  }

  const { data: user } = await supabaseServer
    .from('users')
    .select('first_name, last_name, email, phone')
    .eq('id', record.user_id)
    .single();

  customerName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Customer';
  customerEmail = user?.email || '';
  customerPhone = user?.phone || '';

  return {
    transaction_details: {
      order_id: generateOrderId(type, record.id),
      gross_amount: amount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: customerName.split(' ')[0] || customerName,
      last_name: customerName.split(' ').slice(1).join(' ') || '',
      email: customerEmail,
      phone: customerPhone,
    },
    item_details: [
      {
        id: record.id,
        name: itemName,
        price: amount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/finish`,
    },
  };
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { bookingId, type } = await request.json();

    if (!bookingId || !type) {
      return NextResponse.json({ error: 'bookingId and type are required' }, { status: 400 });
    }

    const lookup = await lookupRecord(type, bookingId);
    if (lookup.error) {
      return NextResponse.json({ error: lookup.error }, { status: 404 });
    }

    const { data: record, table } = lookup;

    if (record.payment_status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    if (record.midtrans_order_id) {
      const createdAt = record.created_at;
      const created = new Date(createdAt);
      const now = new Date();
      const diffHours = (now - created) / (1000 * 60 * 60);
      if (diffHours <= 24) {
        await supabaseServer
          .from(table)
          .update({ midtrans_order_id: null, midtrans_snap_token: null })
          .eq('id', bookingId);
      } else {
        return NextResponse.json({ error: 'Payment expired. Please create a new booking.' }, { status: 400 });
      }
    }

    if (auth.user.id !== record.user_id) {
      const { data: adminCheck } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .single();
      if (adminCheck?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const payload = await buildPayload(type, record);
    if (payload.error) {
      return NextResponse.json({ error: payload.error }, { status: 400 });
    }

    const authHeader = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

    const midtransRes = await fetch(SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok) {
      return NextResponse.json(
        { error: midtransData.error_messages?.[0] || 'Payment gateway error' },
        { status: 500 }
      );
    }

    const orderId = payload.transaction_details.order_id;
    const { error: updateError } = await supabaseServer
      .from(table)
      .update({
        midtrans_snap_token: midtransData.token,
        midtrans_order_id: orderId,
        payment_status: 'unpaid',
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snap_token: midtransData.token,
      redirect_url: midtransData.redirect_url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
