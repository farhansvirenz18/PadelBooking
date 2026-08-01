"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';

const AMENITIES_LIST = ['Floodlights', 'Changing Room', 'Shower', 'Parking', 'Pro Shop', 'Cafe', 'Air Conditioning', 'Seating Area', 'Water Fountain', 'First Aid'];

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-[#E8F5E9] text-[#1B5E20]',
    maintenance: 'bg-[#FFF8E1] text-[#E65100]',
    closed: 'bg-[#FFEBEE] text-[#C62828]',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-surface-container text-on-surface-variant'}`}>
      {status || 'active'}
    </span>
  );
}

function CourtCard({ court, onEdit, onDelete }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-44 bg-surface-container overflow-hidden">
        {court.image_url ? (
          <img src={court.image_url} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">sports_tennis</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={court.status || 'active'} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-bold text-on-surface">{court.name}</h3>
          <span className="inline-block px-2 py-0.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-medium capitalize">
            {court.type}
          </span>
        </div>
        {court.description && (
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{court.description}</p>
        )}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-xs text-on-surface-variant">Base Price</p>
            <p className="text-sm font-bold text-on-surface">Rp {Number(court.base_price || 0).toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Peak Price</p>
            <p className="text-sm font-bold text-[#1B5E20]">Rp {Number(court.peak_price || court.base_price || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
        {court.amenities && court.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {court.amenities.slice(0, 3).map((a) => (
              <span key={a} className="px-2 py-0.5 bg-surface-container rounded-lg text-xs text-on-surface-variant">{a}</span>
            ))}
            {court.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-surface-container rounded-lg text-xs text-on-surface-variant">+{court.amenities.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onEdit(court)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-primary-container text-on-surface text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
          <button onClick={() => onDelete(court)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-error-container text-on-surface text-sm font-medium transition-colors">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CourtModal({ open, onClose, onSave, court }) {
  const [form, setForm] = useState({
    name: '', description: '', type: 'indoor', base_price: '', peak_price: '', image_url: '', amenities: [], status: 'active', location: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (court) {
      setForm({
        name: court.name || '',
        description: court.description || '',
        type: court.type || 'indoor',
        base_price: court.base_price || '',
        peak_price: court.peak_price || '',
        image_url: court.image_url || '',
        amenities: court.amenities || [],
        status: court.status || 'active',
        location: court.location || '',
      });
    } else {
      setForm({ name: '', description: '', type: 'indoor', base_price: '', peak_price: '', image_url: '', amenities: [], status: 'active', location: '' });
    }
  }, [court, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'uploads');
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) setForm((prev) => ({ ...prev, image_url: json.url }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.base_price) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        base_price: Number(form.base_price),
        peak_price: Number(form.peak_price) || Number(form.base_price),
      };
      if (court?.id) {
        await adminFetch('/api/admin/courts', { method: 'PUT', body: JSON.stringify({ id: court.id, ...payload }) });
      } else {
        await adminFetch('/api/admin/courts', { method: 'POST', body: JSON.stringify(payload) });
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
          <h2 className="font-display font-bold text-on-surface text-lg">{court ? 'Edit Court' : 'Create Court'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Court name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" placeholder="Court description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Base Price (Rp) *</label>
              <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="50000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Peak Price (Rp)</label>
              <input type="number" value={form.peak_price} onChange={(e) => setForm({ ...form, peak_price: e.target.value })} min="0" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="75000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Court location" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-outline-variant/60 bg-surface cursor-pointer hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">upload</span>
                <span className="text-sm text-on-surface-variant">{uploading ? 'Uploading...' : 'Choose image'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {form.image_url && (
              <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-white">close</span>
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${form.amenities.includes(amenity) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
              {saving ? 'Saving...' : court ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ open, onClose, onConfirm, court }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch('/api/admin/crud?table=courts&id=' + court.id, { method: 'DELETE' });
      onConfirm();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !court) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[24px] text-error">delete</span>
        </div>
        <h3 className="font-display font-bold text-on-surface text-center text-lg mb-2">Delete Court</h3>
        <p className="text-sm text-on-surface-variant text-center mb-6">Are you sure you want to delete <strong>{court.name}</strong>? This action cannot be undone.</p>
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

const COURT_COLUMNS = [
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Type', key: 'type', width: 12 },
  { header: 'Base Price', key: 'base_price', width: 15 },
  { header: 'Peak Price', key: 'peak_price', width: 15 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Location', key: 'location', width: 18 },
];

export default function AdminCourts() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourt, setEditCourt] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, court: null });

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('includeInactive', 'true');
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const res = await adminFetch(`/api/admin/courts?${params.toString()}`);
      const json = await res.json();
      setCourts(json.data || []);
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourts(); }, [filterType, filterStatus]);

  const filtered = useMemo(() => {
    if (!search) return courts;
    const q = search.toLowerCase();
    return courts.filter((c) => c.name?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [courts, search]);

  const handleSave = () => { setModalOpen(false); setEditCourt(null); fetchCourts(); };
  const handleDelete = () => { setDeleteModal({ open: false, court: null }); fetchCourts(); };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Court Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your padel courts and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filtered} columns={COURT_COLUMNS} filename="courts" title="Courts Report" />
          <button onClick={() => { setEditCourt(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Court
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courts..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
          <option value="">All Types</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Court Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="h-44 bg-surface-container animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-surface-container rounded-lg animate-pulse w-2/3" />
                <div className="h-4 bg-surface-container rounded-lg animate-pulse w-1/2" />
                <div className="h-4 bg-surface-container rounded-lg animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">sports_tennis</span>
          <p className="text-on-surface-variant text-sm">No courts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((court) => (
            <CourtCard key={court.id} court={court} onEdit={(c) => { setEditCourt(c); setModalOpen(true); }} onDelete={(c) => setDeleteModal({ open: true, court: c })} />
          ))}
        </div>
      )}

      <CourtModal open={modalOpen} onClose={() => { setModalOpen(false); setEditCourt(null); }} onSave={handleSave} court={editCourt} />
      <DeleteModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, court: null })} onConfirm={handleDelete} court={deleteModal.court} />
    </div>
  );
}
