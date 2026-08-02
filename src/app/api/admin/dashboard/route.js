import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [confirmedBookings, confirmedCoachBookings, confirmedShopOrders, totalBookings, activeUsers, pendingBookings, timeSlots, activeMemberships, recentBookings] = await Promise.all([
      supabaseServer.from('bookings').select('total_price').eq('payment_status', 'confirmed'),
      supabaseServer.from('coach_bookings').select('total_price').eq('payment_status', 'confirmed'),
      supabaseServer.from('shop_orders').select('total_amount').eq('payment_status', 'confirmed'),
      supabaseServer.from('bookings').select('id', { count: 'exact', head: true }),
      supabaseServer.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabaseServer.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseServer.from('time_slots').select('id, status, date'),
      supabaseServer.from('user_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseServer.from('bookings').select('*, users(first_name, last_name, email), courts(name)').order('created_at', { ascending: false }).limit(10),
    ]);

    const bookingRevenue = (confirmedBookings.data || []).reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
    const coachRevenue = (confirmedCoachBookings.data || []).reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
    const shopRevenue = (confirmedShopOrders.data || []).reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalRevenue = bookingRevenue + coachRevenue + shopRevenue;

    const allSlots = timeSlots.data || [];
    const weekSlots = allSlots.filter(s => {
      const slotDate = new Date(s.date);
      return slotDate >= startOfWeek && slotDate < endOfWeek;
    });
    const bookedSlots = weekSlots.filter(s => s.status === 'booked').length;
    const totalSlots = weekSlots.length;
    const courtUtilization = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    const revenueLast30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueLast30Days.push({ date: dateStr, amount: 0 });
    }

    const { data: recentBookingsData } = await supabaseServer
      .from('bookings')
      .select('*, users(first_name, last_name, email), courts(name)')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    (recentBookingsData || []).forEach(b => {
      const dateStr = b.created_at?.split('T')[0];
      const entry = revenueLast30Days.find(e => e.date === dateStr);
      if (entry && b.payment_status === 'confirmed') {
        entry.amount += parseFloat(b.total_price) || 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings: totalBookings.count || 0,
        activeUsers: activeUsers.count || 0,
        pendingBookings: pendingBookings.count || 0,
        courtUtilization,
        activeMemberships: activeMemberships.count || 0,
        revenueLast30Days,
        recentBookings: recentBookings.data || [],
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
