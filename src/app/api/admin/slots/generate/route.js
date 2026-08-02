import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

function isPeakHour(date, hour) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return hour >= 8 && hour < 22;
  }

  return hour >= 17 && hour < 22;
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { courtId, startDate, endDate, startHour = 7, endHour = 22, slotDuration = 60 } = await request.json();

    if (!courtId || !startDate || !endDate) {
      return NextResponse.json({ error: 'courtId, startDate, and endDate are required' }, { status: 400 });
    }

    const { data: court, error: courtError } = await supabaseServer
      .from('courts')
      .select('id, name, price_per_hour_offpeak, price_per_hour_peak')
      .eq('id', courtId)
      .single();

    if (courtError || !court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const slots = [];
    const slotMinutes = slotDuration;

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      let hour = startHour;

      while (hour < endHour) {
        const startMinutes = 0;
        const endMinutes = startMinutes + slotMinutes;
        const endHourCalc = hour + Math.floor(endMinutes / 60);
        const endMinCalc = endMinutes % 60;

        if (endHourCalc > endHour) break;

        const startTimeStr = `${String(hour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
        const endTimeStr = `${String(endHourCalc).padStart(2, '0')}:${String(endMinCalc).padStart(2, '0')}`;

        const isPeak = isPeakHour(currentDate, hour);

        const { data: existing } = await supabaseServer
          .from('time_slots')
          .select('id')
          .eq('court_id', courtId)
          .eq('date', dateStr)
          .eq('start_time', startTimeStr)
          .eq('end_time', endTimeStr)
          .single();

        if (!existing) {
          slots.push({
            court_id: courtId,
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            price: isPeak ? (court.price_per_hour_peak || court.price_per_hour_offpeak) : court.price_per_hour_offpeak,
            is_peak: isPeak,
            status: 'available',
          });
        }

        hour += Math.ceil(slotMinutes / 60);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (slots.length === 0) {
      return NextResponse.json({ success: true, data: { generated: 0, message: 'All slots already exist' } });
    }

    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const { data, error } = await supabaseServer
        .from('time_slots')
        .insert(batch)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      inserted += (data || []).length;
    }

    return NextResponse.json({
      success: true,
      data: {
        generated: inserted,
        court: court.name,
        dateRange: `${startDate} to ${endDate}`,
        timeRange: `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`,
        slotDuration: `${slotDuration} minutes`,
      },
    });
  } catch (error) {
    console.error('Slot generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
