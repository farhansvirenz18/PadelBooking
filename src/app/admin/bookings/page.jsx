"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'cancelled', 'completed'];
const STATUS_COLORS = {
  pending: 'bg-[#FFF8E1] text-[#E65100]',
  confirmed: 'bg-[#E8F5E9] text-[#1B5E20]',
  cancelled: 'bg-[#FFEBEE] text-[#C62828]',
  completed: 'bg-[#E3F2FD] text-[#1565C0]',
};
const PAYMENT_COLORS = {
  paid: 'bg-[#E8F5E9] text-[#1B5E20]',
  unpaid: 'bg-[#FFF8E1] text-[#E65100]',
  refunded: 'bg-[#FFEBEE] text-[#C62828]',
};

function StatusBadge({ status, colorMap }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[status] || 'bg-surface-container text-on-surface-variant'}`}>
      {status || '-'}
    </span>
  );
}

function BookingRow({ booking }) {
  const user = booking.users || {};
  const court = booking.courts || {};
  const timeSlot = booking.time_slots || {};

  return (
    <tr className="border-b border-outline-variant/15 hover:bg-surface-container/50 transition-colors">
      <td className="px-4 py-3 text-sm text-on-surface font-medium">
        #{booking.id ? String(booking.id).slice(0, 8) : '-'}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-on-surface">{user.email || '-'}</p>
        <p className="text-xs text-on-surface-variant">{user.first_name} {user.last_name}</p>
      </td>
      <td className="px-4 py-3 text-sm text-on-surface">{court.name || '-'}</td>
      <td className="px-4 py-3">
        <p className="text-sm text-on-surface">{booking.date || timeSlot.date || '-'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-on-surface">{booking.time || timeSlot.start_time || '-'}</p>
        {timeSlot.end_time && <p className="text-xs text-on-surface-variant">to {timeSlot.end_time}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{booking.duration || '-'} min</td>
      <td className="px-4 py-3 text-sm font-medium text-on-surface">
        {booking.total_price ? `Rp ${Number(booking.total_price).toLocaleString('id-ID')}` : '-'}
      </td>
      <td className="px-4 py-3"><StatusBadge status={booking.status} colorMap={STATUS_COLORS} /></td>
      <td className="px-4 py-3"><StatusBadge status={booking.payment_status} colorMap={PAYMENT_COLORS} /></td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">
        {booking.created_at ? new Date(booking.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
      </td>
    </tr>
  );
}

const BOOKING_COLUMNS = [
  { header: 'ID', key: 'id', width: 12 },
  { header: 'User Email', key: 'user_email', width: 22 },
  { header: 'Court', key: 'court_name', width: 16 },
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Time', key: 'time', width: 12 },
  { header: 'Duration', key: 'duration', width: 10 },
  { header: 'Amount', key: 'total_price', width: 15 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Payment', key: 'payment_status', width: 12 },
  { header: 'Booked On', key: 'created_at', width: 14 },
];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('offset', '0');
      if (filterStatus) params.set('status', filterStatus);
      const res = await adminFetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();
      setBookings(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); setPage(1); }, [filterStatus]);

  const filtered = useMemo(() => {
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b) => {
      const user = b.users || {};
      const court = b.courts || {};
      return (
        user.email?.toLowerCase().includes(q) ||
        court.name?.toLowerCase().includes(q) ||
        user.first_name?.toLowerCase().includes(q) ||
        user.last_name?.toLowerCase().includes(q) ||
        String(b.id).toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const exportData = useMemo(() => {
    return filtered.map((b) => ({
      id: b.id ? String(b.id).slice(0, 8) : '-',
      user_email: b.users?.email || '-',
      court_name: b.courts?.name || '-',
      date: b.date || b.time_slots?.date || '-',
      time: b.time || b.time_slots?.start_time || '-',
      duration: b.duration || '-',
      total_price: b.total_price || 0,
      status: b.status || '-',
      payment_status: b.payment_status || '-',
      created_at: b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID') : '-',
    }));
  }, [filtered]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Booking Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">View and manage all bookings</p>
        </div>
        <ExportButton data={exportData} columns={BOOKING_COLUMNS} filename="bookings" title="Bookings Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: filtered.length, icon: 'receipt_long', color: 'bg-primary-container text-on-primary-container' },
          { label: 'Pending', count: filtered.filter((b) => b.status === 'pending').length, icon: 'schedule', color: 'bg-[#FFF8E1] text-[#E65100]' },
          { label: 'Confirmed', count: filtered.filter((b) => b.status === 'confirmed').length, icon: 'check_circle', color: 'bg-[#E8F5E9] text-[#1B5E20]' },
          { label: 'Cancelled', count: filtered.filter((b) => b.status === 'cancelled').length, icon: 'cancel', color: 'bg-[#FFEBEE] text-[#C62828]' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
              <p className="text-lg font-display font-bold text-on-surface">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by email, court, or booking ID..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Status'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-container rounded-lg animate-pulse" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">receipt_long</span>
            <p className="text-on-surface-variant text-sm">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-surface-container/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Court</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <BookingRow key={b.id || i} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20">
            <p className="text-sm text-on-surface-variant">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 7 && pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - page) > 1) {
                  if (pageNum === 3 || pageNum === totalPages - 2) return <span key={i} className="px-1 text-on-surface-variant">...</span>;
                  return null;
                }
                return (
                  <button key={i} onClick={() => setPage(pageNum)} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface-variant'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
