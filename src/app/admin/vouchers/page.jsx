"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';

const PAGE_SIZE = 10;

function getVoucherStatus(voucher) {
  const now = new Date();
  const from = voucher.valid_from ? new Date(voucher.valid_from) : null;
  const until = voucher.valid_until ? new Date(voucher.valid_until) : null;
  if (until && now > until) return 'expired';
  if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) return 'maxed out';
  if (from && now < from) return 'scheduled';
  return 'active';
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-[#E8F5E9] text-[#1B5E20]',
    expired: 'bg-[#FFEBEE] text-[#C62828]',
    'maxed out': 'bg-[#FFF8E1] text-[#E65100]',
    scheduled: 'bg-[#E3F2FD] text-[#1565C0]',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-surface-container text-on-surface-variant'}`}>
      {status}
    </span>
  );
}

function VoucherRow({ voucher, onEdit, onDelete }) {
  const status = getVoucherStatus(voucher);
  return (
    <tr className="border-b border-outline-variant/15 hover:bg-surface-container/50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-sm text-[#1B5E20] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
          {voucher.code || '-'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-on-surface max-w-[200px] truncate">{voucher.description || '-'}</td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-on-surface capitalize">{voucher.discount_type || '-'}</span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-on-surface">
        {voucher.discount_type === 'fixed'
          ? `Rp ${Number(voucher.discount_value || 0).toLocaleString('id-ID')}`
          : `${voucher.discount_value || 0}%`
        }
      </td>
      <td className="px-4 py-3 text-sm text-on-surface-variant">
        {voucher.min_purchase ? `Rp ${Number(voucher.min_purchase).toLocaleString('id-ID')}` : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-on-surface">
        {voucher.current_uses || 0} / {voucher.max_uses || '∞'}
      </td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">
        {voucher.valid_from ? new Date(voucher.valid_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
      </td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">
        {voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
      </td>
      <td className="px-4 py-3"><StatusBadge status={status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(voucher)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button onClick={() => onDelete(voucher)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-error-container transition-colors">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function VoucherModal({ open, onClose, onSave, voucher }) {
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percent', discount_value: '',
    min_purchase: '', max_uses: '', valid_from: '', valid_until: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (voucher) {
      setForm({
        code: voucher.code || '',
        description: voucher.description || '',
        discount_type: voucher.discount_type || 'percent',
        discount_value: voucher.discount_value || '',
        min_purchase: voucher.min_purchase || '',
        max_uses: voucher.max_uses || '',
        valid_from: voucher.valid_from ? voucher.valid_from.slice(0, 16) : '',
        valid_until: voucher.valid_until ? voucher.valid_until.slice(0, 16) : '',
        is_active: voucher.is_active !== false,
      });
    } else {
      setForm({ code: '', description: '', discount_type: 'percent', discount_value: '', min_purchase: '', max_uses: '', valid_from: '', valid_until: '', is_active: true });
    }
  }, [voucher, open]);

  const handleCodeChange = (val) => {
    setForm({ ...form, code: val.toUpperCase().replace(/[^A-Z0-9_-]/g, '') });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        min_purchase: Number(form.min_purchase) || 0,
        max_uses: Number(form.max_uses) || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      };
      if (voucher?.id) {
        await adminFetch('/api/admin/vouchers', { method: 'PUT', body: JSON.stringify({ id: voucher.id, ...payload }) });
      } else {
        await adminFetch('/api/admin/vouchers', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSave();
    } catch (err) {
      console.error('Save failed:', err);
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
          <h2 className="font-display font-bold text-on-surface text-lg">{voucher ? 'Edit Voucher' : 'Create Voucher'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Code *</label>
            <input type="text" value={form.code} onChange={(e) => handleCodeChange(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="SUMMER2024" />
            <p className="text-xs text-on-surface-variant mt-1">Auto-formatted to uppercase. Letters, numbers, dash, underscore only.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" placeholder="Voucher description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Discount Type *</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${form.discount_type === 'percent' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container'}`}>
                <input type="radio" name="discount_type" value="percent" checked={form.discount_type === 'percent'} onChange={() => setForm({ ...form, discount_type: 'percent' })} className="hidden" />
                <span className="material-symbols-outlined text-[18px]">percent</span>
                <span className="text-sm font-medium">Percent (%)</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${form.discount_type === 'fixed' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant/50 bg-surface text-on-surface-variant hover:bg-surface-container'}`}>
                <input type="radio" name="discount_type" value="fixed" checked={form.discount_type === 'fixed'} onChange={() => setForm({ ...form, discount_type: 'fixed' })} className="hidden" />
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="text-sm font-medium">Fixed (Rp)</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Discount Value *</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder={form.discount_type === 'percent' ? '10' : '50000'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Min Purchase (Rp)</label>
              <input type="number" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Max Uses</label>
            <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Leave empty for unlimited" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Valid From</label>
              <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Valid Until</label>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-on-surface">Active</label>
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-primary' : 'bg-surface-container-high'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
              {saving ? 'Saving...' : voucher ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ open, onClose, onConfirm, voucher }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch('/api/admin/vouchers', { method: 'DELETE', body: JSON.stringify({ id: voucher.id }) });
      onConfirm();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !voucher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[24px] text-error">delete</span>
        </div>
        <h3 className="font-display font-bold text-on-surface text-center text-lg mb-2">Delete Voucher</h3>
        <p className="text-sm text-on-surface-variant text-center mb-6">Are you sure you want to delete voucher <strong className="font-mono">{voucher.code}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-[#B71C1C] transition-colors disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

const VOUCHER_COLUMNS = [
  { header: 'Code', key: 'code', width: 14 },
  { header: 'Description', key: 'description', width: 22 },
  { header: 'Type', key: 'discount_type', width: 10 },
  { header: 'Value', key: 'discount_value', width: 12 },
  { header: 'Min Purchase', key: 'min_purchase', width: 14 },
  { header: 'Uses', key: 'uses', width: 10 },
  { header: 'Valid From', key: 'valid_from', width: 14 },
  { header: 'Valid Until', key: 'valid_until', width: 14 },
  { header: 'Status', key: 'status', width: 12 },
];

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, voucher: null });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/vouchers');
      const json = await res.json();
      setVouchers(json.data || []);
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  const filtered = useMemo(() => {
    let result = vouchers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) => v.code?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q));
    }
    if (filterStatus) {
      result = result.filter((v) => getVoucherStatus(v) === filterStatus);
    }
    return result;
  }, [vouchers, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const exportData = useMemo(() => {
    return filtered.map((v) => ({
      code: v.code || '-',
      description: v.description || '-',
      discount_type: v.discount_type || '-',
      discount_value: v.discount_value || 0,
      min_purchase: v.min_purchase || 0,
      uses: `${v.current_uses || 0} / ${v.max_uses || '∞'}`,
      valid_from: v.valid_from ? new Date(v.valid_from).toLocaleDateString('id-ID') : '-',
      valid_until: v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID') : '-',
      status: getVoucherStatus(v),
    }));
  }, [filtered]);

  const handleSave = () => { setModalOpen(false); setEditVoucher(null); fetchVouchers(); };
  const handleDelete = () => { setDeleteModal({ open: false, voucher: null }); fetchVouchers(); };

  const stats = useMemo(() => ({
    total: vouchers.length,
    active: vouchers.filter((v) => getVoucherStatus(v) === 'active').length,
    expired: vouchers.filter((v) => getVoucherStatus(v) === 'expired').length,
    maxedOut: vouchers.filter((v) => getVoucherStatus(v) === 'maxed out').length,
  }), [vouchers]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Voucher Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Create and manage discount vouchers</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportData} columns={VOUCHER_COLUMNS} filename="vouchers" title="Vouchers Report" />
          <button onClick={() => { setEditVoucher(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Voucher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: stats.total, icon: 'confirmation_number', color: 'bg-primary-container text-on-primary-container' },
          { label: 'Active', count: stats.active, icon: 'check_circle', color: 'bg-[#E8F5E9] text-[#1B5E20]' },
          { label: 'Expired', count: stats.expired, icon: 'schedule', color: 'bg-[#FFEBEE] text-[#C62828]' },
          { label: 'Maxed Out', count: stats.maxedOut, icon: 'block', color: 'bg-[#FFF8E1] text-[#E65100]' },
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
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by code or description..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="maxed out">Maxed Out</option>
          <option value="scheduled">Scheduled</option>
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
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">confirmation_number</span>
            <p className="text-on-surface-variant text-sm">No vouchers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Min Purchase</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Valid From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Valid Until</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((v, i) => (
                  <VoucherRow key={v.id || i} voucher={v} onEdit={(v) => { setEditVoucher(v); setModalOpen(true); }} onDelete={(v) => setDeleteModal({ open: true, voucher: v })} />
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

      <VoucherModal open={modalOpen} onClose={() => { setModalOpen(false); setEditVoucher(null); }} onSave={handleSave} voucher={editVoucher} />
      <DeleteModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, voucher: null })} onConfirm={handleDelete} voucher={deleteModal.voucher} />
    </div>
  );
}
