import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { tierId } = await request.json();

    if (!tierId) {
      return NextResponse.json({ error: 'tierId is required' }, { status: 400 });
    }

    const { data: tier, error: tierError } = await supabaseServer
      .from('membership_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('is_active', true)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }

    // Check for existing active membership to warn (handled on frontend, but we can return it if needed)
    // We don't cancel it here. It will be cancelled in verify/route.js when new one is paid.

    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const orderId = `MB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data: membership, error: memError } = await supabaseServer
      .from('user_memberships')
      .insert({
        user_id: auth.user.id,
        tier_id: tierId,
        start_date: startDate,
        end_date: endDate.toISOString(),
        status: 'active',
        payment_status: 'unpaid',
        midtrans_order_id: orderId,
      })
      .select()
      .single();

    if (memError) throw memError;

    // Create Midtrans transaction
    const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
    const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const API_URL = MIDTRANS_IS_PRODUCTION
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authHeader = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
    
    // Get user details for Midtrans
    const { data: userProfile } = await supabaseServer
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', auth.user.id)
      .single();

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
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
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/finish`,
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
      console.error('Midtrans Error:', err);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    const midtransData = await midtransRes.json();

    return NextResponse.json({ success: true, data: membership, payment_url: midtransData.redirect_url }, { status: 201 });
  } catch (error) {
    console.error('Membership subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
