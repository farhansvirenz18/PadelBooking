import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  const auth = await verifyAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const { teamName, partnerName, notes } = await request.json();

    const { data: tournament, error: tournamentError } = await supabaseServer
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'upcoming' && tournament.status !== 'registering') {
      return NextResponse.json({ error: 'Tournament registration is closed' }, { status: 400 });
    }

    if (tournament.max_participants) {
      const { data: success } = await supabaseServer.rpc('increment_tournament_participants', {
        p_tournament_id: id,
      });
      if (!success) {
        return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
      }
    }

    const { data: existing } = await supabaseServer
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', auth.user.id)
      .single();

    if (existing) {
      if (tournament.max_participants) {
        await supabaseServer
          .from('tournaments')
          .update({ current_participants: tournament.current_participants })
          .eq('id', id);
      }
      return NextResponse.json({ error: 'Already registered for this tournament' }, { status: 400 });
    }

    const { data: registration, error: regError } = await supabaseServer
      .from('tournament_registrations')
      .insert({
        tournament_id: id,
        user_id: auth.user.id,
        team_name: teamName || null,
        partner_name: partnerName || null,
        notes: notes || null,
        status: 'registered',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (regError) throw regError;

    return NextResponse.json({ success: true, data: registration }, { status: 201 });
  } catch (error) {
    console.error('Tournament registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
