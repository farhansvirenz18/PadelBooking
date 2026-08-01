"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';

const PAGE_SIZE = 10;
const ROLE_OPTIONS = ['', 'user', 'admin', 'coach'];

const ROLE_COLORS = {
  admin: 'bg-[#E8F5E9] text-[#1B5E20]',
  coach: 'bg-[#E3F2FD] text-[#1565C0]',
  user: 'bg-surface-container text-on-surface-variant',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[role] || 'bg-surface-container text-on-surface-variant'}`}>
      {role || 'user'}
    </span>
  );
}

function UserAvatar({ user }) {
  const initials = `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold">
      {initials || '?'}
    </div>
  );
}

function UserRow({ user, onView }) {
  return (
    <tr className="border-b border-outline-variant/15 hover:bg-surface-container/50 transition-colors">
      <td className="px-4 py-3"><UserAvatar user={user} /></td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-on-surface">{user.first_name} {user.last_name}</p>
      </td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{user.email || '-'}</td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">{user.phone || '-'}</td>
      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
      <td className="px-4 py-3 text-sm text-on-surface-variant capitalize">{user.padel_level || '-'}</td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">
        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onView(user)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[16px]">visibility</span>
        </button>
      </td>
    </tr>
  );
}

function UserDetailModal({ open, onClose, user }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest rounded-t-2xl z-10">
          <h2 className="font-display font-bold text-on-surface text-lg">User Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-container text-on-primary-container flex items-center justify-center text-xl font-bold">
                  {(user.first_name || '')[0] || '?'}{(user.last_name || '')[0] || ''}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-on-surface text-lg">{user.first_name} {user.last_name}</h3>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Email', value: user.email, icon: 'email' },
              { label: 'Phone', value: user.phone, icon: 'phone' },
              { label: 'Padel Level', value: user.padel_level, icon: 'sports_tennis' },
              { label: 'Joined', value: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', icon: 'calendar_today' },
              { label: 'Total Bookings', value: user.booking_count ?? '-', icon: 'receipt_long' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
                <div>
                  <p className="text-xs text-on-surface-variant">{item.label}</p>
                  <p className="text-sm font-medium text-on-surface">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="w-full mt-6 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '', phone: '', role: 'user',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ email: '', password: '', first_name: '', last_name: '', phone: '', role: 'user' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.first_name || !form.last_name) return;
    setSaving(true);
    try {
      await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
      onSave();
    } catch (err) {
      console.error('Create user failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest rounded-t-2xl z-10">
          <h2 className="font-display font-bold text-on-surface text-lg">Create User</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">First Name *</label>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Last Name *</label>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Min. 6 characters" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="08123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="coach">Coach</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const USER_COLUMNS = [
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Email', key: 'email', width: 24 },
  { header: 'Phone', key: 'phone', width: 16 },
  { header: 'Role', key: 'role', width: 10 },
  { header: 'Padel Level', key: 'padel_level', width: 14 },
  { header: 'Joined', key: 'created_at', width: 14 },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [detailModal, setDetailModal] = useState({ open: false, user: null });
  const [createModal, setCreateModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      const res = await adminFetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      setUsers(json.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); setPage(1); }, [filterRole]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const exportData = useMemo(() => {
    return filtered.map((u) => ({
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      email: u.email || '-',
      phone: u.phone || '-',
      role: u.role || 'user',
      padel_level: u.padel_level || '-',
      created_at: u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-',
    }));
  }, [filtered]);

  const handleSave = () => { setCreateModal(false); fetchUsers(); };

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    coaches: users.filter((u) => u.role === 'coach').length,
    regularUsers: users.filter((u) => !u.role || u.role === 'user').length,
  }), [users]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">User Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">View and manage all registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportData} columns={USER_COLUMNS} filename="users" title="Users Report" />
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', count: stats.total, icon: 'people', color: 'bg-primary-container text-on-primary-container' },
          { label: 'Admins', count: stats.admins, icon: 'admin_panel_settings', color: 'bg-[#E8F5E9] text-[#1B5E20]' },
          { label: 'Coaches', count: stats.coaches, icon: 'sports', color: 'bg-[#E3F2FD] text-[#1565C0]' },
          { label: 'Regular Users', count: stats.regularUsers, icon: 'person', color: 'bg-surface-container text-on-surface-variant' },
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
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="coach">Coach</option>
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
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">people</span>
            <p className="text-on-surface-variant text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-surface-container/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Avatar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => (
                  <UserRow key={u.id || i} user={u} onView={(u) => setDetailModal({ open: true, user: u })} />
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

      <UserDetailModal open={detailModal.open} onClose={() => setDetailModal({ open: false, user: null })} user={detailModal.user} />
      <CreateUserModal open={createModal} onClose={() => setCreateModal(false)} onSave={handleSave} />
    </div>
  );
}
