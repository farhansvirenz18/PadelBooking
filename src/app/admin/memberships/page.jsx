"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';
import { toast } from 'sonner';

const PERK_OPTIONS = [
  { value: 'free_racket_rental', label: 'Free Racket Rental' },
  { value: 'priority_booking', label: 'Priority Booking' },
  { value: 'guest_pass', label: 'Guest Pass' },
  { value: 'discount_court', label: 'Court Discount' },
  { value: 'free_guest_session', label: 'Free Guest Session' },
  { value: 'exclusive_events', label: 'Exclusive Events' },
  { value: 'priority_support', label: 'Priority Support' },
  { value: 'locker_access', label: 'Locker Access' },
];

function StatusBadge({ active }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${active ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'bg-[#FFEBEE] text-[#C62828]'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function TierCard({ tier, onEdit, onDelete }) {
  const perks = tier.perks || [];
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-on-surface text-lg">{tier.name}</h3>
            {tier.description && (
              <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{tier.description}</p>
            )}
          </div>
          <StatusBadge active={tier.is_active} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-xs text-on-surface-variant">Monthly Price</p>
            <p className="text-lg font-display font-bold text-[#1B5E20]">
              Rp {Number(tier.monthly_price || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-xs text-on-surface-variant">Discount</p>
            <p className="text-lg font-display font-bold text-on-surface">
              {tier.discount_percent || 0}%
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-xs text-on-surface-variant">Priority Booking</p>
            <p className="text-lg font-display font-bold text-on-surface">
              {tier.priority_booking_days || 0} days
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-xs text-on-surface-variant">Free Credits</p>
            <p className="text-lg font-display font-bold text-on-surface">
              {tier.free_credits || 0}
            </p>
          </div>
        </div>

        {perks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-on-surface-variant mb-2">Perks</p>
            <div className="flex flex-wrap gap-1.5">
              {perks.map((perk) => (
                <span key={perk} className="px-2.5 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-medium">
                  {PERK_OPTIONS.find((p) => p.value === perk)?.label || perk}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
          <button onClick={() => onEdit(tier)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-primary-container text-on-surface text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
          <button onClick={() => onDelete(tier)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-error-container text-on-surface text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TierModal({ open, onClose, onSave, tier }) {
  const [form, setForm] = useState({
    name: '', description: '', monthly_price: '', discount_percent: '',
    priority_booking_days: '', free_credits: '', perks: [], is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tier) {
      setForm({
        name: tier.name || '',
        description: tier.description || '',
        monthly_price: tier.monthly_price || '',
        discount_percent: tier.discount_percent || '',
        priority_booking_days: tier.priority_booking_days || '',
        free_credits: tier.free_credits || '',
        perks: tier.perks || [],
        is_active: tier.is_active !== false,
      });
    } else {
      setForm({ name: '', description: '', monthly_price: '', discount_percent: '', priority_booking_days: '', free_credits: '', perks: [], is_active: true });
    }
  }, [tier, open]);

  const togglePerk = (perk) => {
    setForm((prev) => ({
      ...prev,
      perks: prev.perks.includes(perk) ? prev.perks.filter((p) => p !== perk) : [...prev.perks, perk],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.monthly_price) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthly_price: Number(form.monthly_price),
        discount_percent: Number(form.discount_percent) || 0,
        priority_booking_days: Number(form.priority_booking_days) || 0,
        free_credits: Number(form.free_credits) || 0,
      };
      if (tier?.id) {
        await adminFetch('/api/admin/memberships', { method: 'PUT', body: JSON.stringify({ id: tier.id, ...payload }) });
        toast.success('Membership updated successfully');
      } else {
        await adminFetch('/api/admin/memberships', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Membership created successfully');
      }
      onSave();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save membership');
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
          <h2 className="font-display font-bold text-on-surface text-lg">{tier ? 'Edit Membership' : 'Create Membership'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Tier name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" placeholder="Tier description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Monthly Price (Rp) *</label>
              <input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} required min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="50000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Discount (%)</label>
              <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} min="0" max="100" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Priority Booking (days)</label>
              <input type="number" value={form.priority_booking_days} onChange={(e) => setForm({ ...form, priority_booking_days: e.target.value })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Free Credits</label>
              <input type="number" value={form.free_credits} onChange={(e) => setForm({ ...form, free_credits: e.target.value })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Perks</label>
            <div className="flex flex-wrap gap-2">
              {PERK_OPTIONS.map((perk) => (
                <button key={perk.value} type="button" onClick={() => togglePerk(perk.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${form.perks.includes(perk.value) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  {perk.label}
                </button>
              ))}
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
              {saving ? 'Saving...' : tier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ open, onClose, onConfirm, tier }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch('/api/admin/memberships', { method: 'DELETE', body: JSON.stringify({ id: tier.id }) });
      toast.success('Membership deleted successfully');
      onConfirm();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete membership');
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !tier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[24px] text-error">delete</span>
        </div>
        <h3 className="font-display font-bold text-on-surface text-center text-lg mb-2">Delete Membership</h3>
        <p className="text-sm text-on-surface-variant text-center mb-6">Are you sure you want to delete <strong>{tier.name}</strong>? This action cannot be undone.</p>
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

const MEMBERSHIP_COLUMNS = [
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Monthly Price', key: 'monthly_price', width: 15 },
  { header: 'Discount %', key: 'discount_percent', width: 12 },
  { header: 'Priority Days', key: 'priority_booking_days', width: 14 },
  { header: 'Free Credits', key: 'free_credits', width: 12 },
  { header: 'Perks', key: 'perks', width: 20 },
  { header: 'Active', key: 'is_active', width: 10 },
];

export default function AdminMemberships() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTier, setEditTier] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, tier: null });

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/memberships');
      const json = await res.json();
      setTiers(json.data || []);
    } catch (err) {
      console.error('Failed to fetch memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTiers(); }, []);

  const exportData = useMemo(() => {
    return tiers.map((t) => ({
      name: t.name || '-',
      monthly_price: t.monthly_price || 0,
      discount_percent: t.discount_percent || 0,
      priority_booking_days: t.priority_booking_days || 0,
      free_credits: t.free_credits || 0,
      perks: (t.perks || []).join(', '),
      is_active: t.is_active ? 'Yes' : 'No',
    }));
  }, [tiers]);

  const handleSave = () => { setModalOpen(false); setEditTier(null); fetchTiers(); };
  const handleDelete = () => { setDeleteModal({ open: false, tier: null }); fetchTiers(); };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Membership Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage membership tiers, pricing, and perks</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportData} columns={MEMBERSHIP_COLUMNS} filename="memberships" title="Memberships Report" />
          <button onClick={() => { setEditTier(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Tier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tiers', count: tiers.length, icon: 'card_membership', color: 'bg-primary-container text-on-primary-container' },
          { label: 'Active', count: tiers.filter((t) => t.is_active).length, icon: 'check_circle', color: 'bg-[#E8F5E9] text-[#1B5E20]' },
          { label: 'Inactive', count: tiers.filter((t) => !t.is_active).length, icon: 'cancel', color: 'bg-[#FFEBEE] text-[#C62828]' },
          { label: 'Avg Price', count: tiers.length ? `Rp ${Math.round(tiers.reduce((s, t) => s + Number(t.monthly_price || 0), 0) / tiers.length).toLocaleString('id-ID')}` : 'Rp 0', icon: 'payments', color: 'bg-[#E3F2FD] text-[#1565C0]' },
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

      {/* Tier Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="h-6 bg-surface-container rounded-lg animate-pulse w-1/2" />
                <div className="h-4 bg-surface-container rounded-lg animate-pulse w-3/4" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-surface-container rounded-xl animate-pulse" />
                  <div className="h-16 bg-surface-container rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">card_membership</span>
          <p className="text-on-surface-variant text-sm">No membership tiers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onEdit={(t) => { setEditTier(t); setModalOpen(true); }} onDelete={(t) => setDeleteModal({ open: true, tier: t })} />
          ))}
        </div>
      )}

      <TierModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTier(null); }} onSave={handleSave} tier={editTier} />
      <DeleteModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, tier: null })} onConfirm={handleDelete} tier={deleteModal.tier} />
    </div>
  );
}
