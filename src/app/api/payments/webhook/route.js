import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

function verifySignature(orderId, statusCode, grossAmount, signature) {
  const payload = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

const STATUS_MAP = {
  capture: 'paid',
  settlement: 'paid',
  pending: 'unpaid',
  deny: 'refunded',
  expire: 'refunded',
  cancel: 'refunded',
};

function getOrderPrefix(orderId) {
  if (orderId.startsWith('BK')) return 'bookings';
  if (orderId.startsWith('CB')) return 'coach_bookings';
  if (orderId.startsWith('TR')) return 'tournament_registrations';
  if (orderId.startsWith('SO')) return 'shop_orders';
  if (orderId.startsWith('MB')) return 'user_memberships';
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isValid = verifySignature(order_id, status_code, gross_amount, signature_key);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const table = getOrderPrefix(order_id);
    if (!table) {
      return NextResponse.json({ error: 'Unknown order prefix' }, { status: 400 });
    }

    const { data: record, error: lookupError } = await supabaseServer
      .from(table)
      .select('*')
      .eq('midtrans_order_id', order_id)
      .single();

    if (lookupError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (record.payment_status === 'paid' && (transaction_status === 'capture' || transaction_status === 'settlement')) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    if (record.payment_status === 'refunded') {
      return NextResponse.json({ success: true, message: 'Record was refunded' });
    }

    let expectedAmount;
    if (table === 'bookings') {
      expectedAmount = parseFloat(record.total_price);
    } else if (table === 'coach_bookings') {
      expectedAmount = parseFloat(record.total_price);
    } else if (table === 'shop_orders') {
      expectedAmount = parseFloat(record.total_price);
    } else if (table === 'tournament_registrations') {
      const { data: tournament } = await supabaseServer
        .from('tournaments')
        .select('entry_fee')
        .eq('id', record.tournament_id)
        .single();
      expectedAmount = parseFloat(tournament?.entry_fee || 0);
    } else if (table === 'user_memberships') {
      const { data: tier } = await supabaseServer
        .from('membership_tiers')
        .select('monthly_price')
        .eq('id', record.tier_id)
        .single();
      expectedAmount = parseFloat(tier?.monthly_price || 0);
    }

    const receivedAmount = parseFloat(gross_amount);
    if (expectedAmount && Math.abs(expectedAmount - receivedAmount) > 0.01) {
      console.error(`Amount mismatch for ${order_id}: expected ${expectedAmount}, got ${receivedAmount}`);
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    const paymentStatus = STATUS_MAP[transaction_status] || 'pending';

    const updateData = {
      payment_status: paymentStatus,
      payment_method: payment_type || null,
    };

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseServer
      .from(table)
      .update(updateData)
      .eq('id', record.id);

    if (updateError) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    if (table === 'bookings' && paymentStatus === 'paid') {
      await supabaseServer
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', record.id)
        .eq('status', 'pending');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
