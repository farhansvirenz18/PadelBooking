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

    const { data: existing } = await supabaseServer
      .from('user_memberships')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .single();

    if (existing) {
      if (existing.tier_id === tierId) {
        return NextResponse.json({ error: 'Already subscribed to this tier' }, { status: 400 });
      }

      await supabaseServer
        .from('user_memberships')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (tier.duration_months || 1));

    const { data: membership, error: memError } = await supabaseServer
      .from('user_memberships')
      .insert({
        user_id: auth.user.id,
        tier_id: tierId,
        start_date: startDate,
        end_date: endDate.toISOString(),
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (memError) throw memError;

    return NextResponse.json({ success: true, data: membership }, { status: 201 });
  } catch (error) {
    console.error('Membership subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
