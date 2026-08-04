import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { membershipId } = await request.json();

    if (!membershipId) {
      return NextResponse.json({ error: 'membershipId is required' }, { status: 400 });
    }

    const { data: membership, error: memError } = await supabaseServer
      .from('user_memberships')
      .select('*, membership_tiers(*)')
      .eq('id', membershipId)
      .eq('user_id', auth.user.id)
      .eq('payment_status', 'unpaid')
      .single();

    if (memError || !membership) {
      return NextResponse.json({ error: 'Pending membership not found' }, { status: 404 });
    }

    const tier = membership.membership_tiers;
    if (!tier) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }

    // Re-create Midtrans transaction with the same order ID
    const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
    const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const API_URL = MIDTRANS_IS_PRODUCTION
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authHeader = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

    const { data: userProfile } = await supabaseServer
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', auth.user.id)
      .single();

    // Generate new order ID so Midtrans doesn't reject duplicate
    const newOrderId = `MB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Update order ID in our database
    await supabaseServer
      .from('user_memberships')
      .update({ midtrans_order_id: newOrderId })
      .eq('id', membershipId);

    const midtransPayload = {
      transaction_details: {
        order_id: newOrderId,
        gross_amount: Math.round(tier.monthly_price),
      },
      item_details: [
        {
          id: tier.id,
          price: Math.round(tier.monthly_price),
          quantity: 1,
          name: `Membership: ${tier.name}`,
        },
      ],
      customer_details: {
        first_name: userProfile?.first_name || auth.user.user_metadata?.first_name || 'Member',
        last_name: userProfile?.last_name || auth.user.user_metadata?.last_name || '',
        email: auth.user.email,
        phone: userProfile?.phone || auth.user.user_metadata?.phone || '',
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/finish`,
      },
    };

    const midtransRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(midtransPayload),
    });

    if (!midtransRes.ok) {
      const err = await midtransRes.text();
      console.error('Midtrans Resume Error:', err);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    const midtransData = await midtransRes.json();

    return NextResponse.json({ success: true, payment_url: midtransData.redirect_url });
  } catch (error) {
    console.error('Membership resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
