"use client"
import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import RevenueChart from '@/components/admin/RevenueChart';
import BookingCharts from '@/components/admin/BookingCharts';
import ExportButton from '@/components/admin/ExportButton';

function StatCard({ icon, label, value, sub, loading }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-[22px]">{icon}</span>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-surface-container rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-display font-bold text-on-surface">{value}</p>
      )}
      {sub && !loading && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
    </div>
  );
}

function BookingRow({ b }) {
  const statusColors = {
    confirmed: 'bg-[#E8F5E9] text-[#1B5E20]',
    pending: 'bg-[#FFF8E1] text-[#E65100]',
    cancelled: 'bg-[#FFEBEE] text-[#C62828]',
    completed: 'bg-[#E8F5E9] text-[#1B5E20]',
  };
  return (
    <tr className="border-b border-outline-variant/15 hover:bg-surface-container/50 transition-colors">
      <td className="px-4 py-3 text-sm text-on-surface">{b.user_name || b.user_email || '-'}</td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{b.court_name || '-'}</td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{b.date || '-'}</td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{b.time || '-'}</td>
      <td className="px-4 py-3 text-sm font-medium text-on-surface">
        {b.total_price ? `Rp ${Number(b.total_price).toLocaleString('id-ID')}` : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-surface-container text-on-surface-variant'}`}>
          {b.status || '-'}
        </span>
      </td>
    </tr>
  );
}

const BOOKING_COLUMNS = [
  { header: 'User', key: 'user_name', width: 20 },
  { header: 'Court', key: 'court_name', width: 18 },
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Time', key: 'time', width: 12 },
  { header: 'Price', key: 'total_price', width: 15 },
  { header: 'Status', key: 'status', width: 12 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch('/api/admin/dashboard');
        const json = await res.json();
        setStats(json.stats || {});
        setBookings(json.recentBookings || []);
        setRevenueData(json.revenueData || []);
        setStatusData(json.statusData || []);
        setDailyData(json.dailyData || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (v) => {
    if (v === null || v === undefined) return '-';
    return `Rp ${Number(v).toLocaleString('id-ID')}`;
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">Overview of your PadelBook platform</p>
        </div>
        <ExportButton
          data={bookings}
          columns={BOOKING_COLUMNS}
          filename="recent-bookings"
          title="Recent Bookings Report"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="payments" label="Total Revenue" value={formatCurrency(stats.totalRevenue)} loading={loading} />
        <StatCard icon="receipt_long" label="Total Bookings" value={stats.totalBookings ?? '-'} loading={loading} />
        <StatCard icon="group" label="Active Users" value={stats.activeUsers ?? '-'} loading={loading} />
        <StatCard icon="schedule" label="Pending Bookings" value={stats.pendingBookings ?? '-'} loading={loading} />
        <StatCard icon="sports_tennis" label="Court Utilization" value={stats.courtUtilization ? `${stats.courtUtilization}%` : '-'} loading={loading} />
        <StatCard icon="card_membership" label="Active Members" value={stats.activeMembers ?? '-'} loading={loading} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
        <h2 className="font-display font-bold text-on-surface mb-4">Revenue (Last 30 Days)</h2>
        {loading ? (
          <div className="h-72 bg-surface-container rounded-xl animate-pulse" />
        ) : (
          <RevenueChart data={revenueData} />
        )}
      </div>

      {/* Booking Analytics */}
      <div>
        <h2 className="font-display font-bold text-on-surface mb-4">Booking Analytics</h2>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-surface-container rounded-xl animate-pulse" />
            <div className="h-80 bg-surface-container rounded-xl animate-pulse" />
          </div>
        ) : (
          <BookingCharts statusData={statusData} dailyData={dailyData} />
        )}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-display font-bold text-on-surface">Recent Bookings</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse" />
            ))}
          </div>
        ) : bookings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Court</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((b, i) => (
                  <BookingRow key={b.id || i} b={b} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-on-surface-variant text-sm">No bookings yet</div>
        )}
      </div>
    </div>
  );
}
