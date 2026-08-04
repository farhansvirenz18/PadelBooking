import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const STATUS_API_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

const STATUS_MAP = {
  capture: 'paid',
  settlement: 'paid',
  pending: 'unpaid',
  deny: 'refunded',
  expire: 'refunded',
  cancel: 'refunded',
};

function getTable(orderId) {
  if (orderId.startsWith('BK')) return 'bookings';
  if (orderId.startsWith('CB')) return 'coach_bookings';
  if (orderId.startsWith('TR')) return 'tournament_registrations';
  if (orderId.startsWith('SO')) return 'shop_orders';
  if (orderId.startsWith('MB')) return 'user_memberships';
  return null;
}

export async function POST(request) {
  try {
    const { order_id } = await request.json();
    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    const table = getTable(order_id);
    if (!table) {
      return NextResponse.json({ error: 'Unknown order type' }, { status: 400 });
    }

    // Check status from Midtrans
    const authHeader = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
    const midtransRes = await fetch(`${STATUS_API_URL}/${order_id}/status`, {
      headers: { Authorization: authHeader },
    });

    if (!midtransRes.ok) {
      return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
    }

    const midtransData = await midtransRes.json();
    const transactionStatus = midtransData.transaction_status;
    const paymentStatus = STATUS_MAP[transactionStatus] || 'unpaid';

    // Find record in DB
    const { data: record, error: lookupError } = await supabaseServer
      .from(table)
      .select('id, payment_status, status')
      .eq('midtrans_order_id', order_id)
      .single();

    if (lookupError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Only update if status changed
    if (record.payment_status !== paymentStatus) {
      const updateData = {
        payment_status: paymentStatus,
        payment_method: midtransData.payment_type || null,
      };

      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        updateData.paid_at = new Date().toISOString();
      }

      await supabaseServer
        .from(table)
        .update(updateData)
        .eq('id', record.id);

      // Update booking status to confirmed when paid
      if (table === 'bookings' && paymentStatus === 'paid') {
        await supabaseServer
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', record.id)
          .eq('status', 'pending');
      }

      // Update shop order status to processing when paid
      if (table === 'shop_orders' && paymentStatus === 'paid') {
        await supabaseServer
          .from('shop_orders')
          .update({ status: 'processing' })
          .eq('id', record.id)
          .eq('status', 'pending');
      }
    }

    return NextResponse.json({
      success: true,
      payment_status: paymentStatus,
      transaction_status: transactionStatus,
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
