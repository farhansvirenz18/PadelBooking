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
  capture: 'confirmed',
  settlement: 'confirmed',
  pending: 'pending',
  deny: 'failed',
  expire: 'cancelled',
  cancel: 'cancelled',
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
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isValid = verifySignature(order_id, status_code, gross_amount, signature_key);
    if (!isValid) {
      console.error('Invalid webhook signature for order:', order_id);
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
      console.error('Record not found for order:', order_id);
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
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
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    if (table === 'bookings' && paymentStatus === 'confirmed') {
      const { data: timeSlot } = await supabaseServer
        .from('time_slots')
        .select('id')
        .eq('id', record.time_slot_id)
        .single();

      if (timeSlot) {
        await supabaseServer
          .from('time_slots')
          .update({ status: 'booked' })
          .eq('id', timeSlot.id);
      }

      await supabaseServer
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', record.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
