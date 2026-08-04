"use client"
import { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import ExportButton from '@/components/admin/ExportButton';
import { toast } from 'sonner';

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    dates.push(toLocalISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function TimeSlotCell({ slot, onToggleBlock }) {
  if (!slot) {
    return <div className="h-10 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-center text-xs text-on-surface-variant/50">--</div>;
  }

  const colorMap = {
    available: 'bg-[#E8F5E9] border-[#A5D6A7] text-[#1B5E20] hover:bg-[#C8E6C9]',
    booked: 'bg-[#FFEBEE] border-[#EF9A9A] text-[#C62828]',
    blocked: 'bg-surface-dim border-outline-variant/30 text-on-surface-variant',
  };

  const isClickable = slot.status === 'available' || slot.status === 'blocked';

  return (
    <button
      onClick={() => isClickable && onToggleBlock(slot)}
      disabled={!isClickable}
      title={`${slot.start_time} - ${slot.end_time} | ${slot.status}${slot.is_peak ? ' | Peak' : ''}`}
      className={`h-10 rounded-lg border px-1 text-xs font-medium transition-colors ${colorMap[slot.status] || colorMap.available} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="block leading-tight">{slot.start_time}</span>
    </button>
  );
}

function GenerateSlotsModal({ open, onClose, onGenerate, courts }) {
  const [form, setForm] = useState({ courtId: '', startDate: '', endDate: '', startHour: 7, endHour: 22, slotDuration: 60 });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      const today = toLocalISODate(new Date());
      const nextWeek = toLocalISODate(new Date(Date.now() + 7 * 86400000));
      setForm({ courtId: '', startDate: today, endDate: nextWeek, startHour: 7, endHour: 22, slotDuration: 60 });
      setResult(null);
    }
  }, [open]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.courtId || !form.startDate || !form.endDate) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await adminFetch('/api/admin/slots/generate', { method: 'POST', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        toast.success(`Generated ${json.data.generated} time slots`);
        setTimeout(() => { onGenerate(); }, 1500);
      } else {
        toast.error('Failed to generate slots');
      }
    } catch (err) {
      console.error('Generate failed:', err);
      toast.error('Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-display font-bold text-on-surface text-lg">Generate Time Slots</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Court *</label>
            <select value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
              <option value="">Select court</option>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Start Hour</label>
              <select value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                {[...Array(16)].map((_, i) => <option key={i} value={i + 5}>{String(i + 5).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">End Hour</label>
              <select value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                {[...Array(18)].map((_, i) => <option key={i} value={i + 6}>{String(i + 6).padStart(2, '0')}:00</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Slot Duration (minutes)</label>
            <select value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
          {result && (
            <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[18px] text-[#1B5E20]">check_circle</span>
                <p className="text-sm font-medium text-[#1B5E20]">Generated {result.generated} slots</p>
              </div>
              <p className="text-xs text-[#2E7D32] ml-7">{result.court} | {result.dateRange} | {result.timeRange}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" disabled={generating} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockConfirmModal({ open, onClose, onConfirm, slot, blocking }) {
  if (!open || !slot) return null;
  const isBlocking = slot.status === 'available';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isBlocking ? 'bg-[#FFF8E1]' : 'bg-[#E8F5E9]'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isBlocking ? 'text-[#E65100]' : 'text-[#1B5E20]'}`}>
            {isBlocking ? 'block' : 'lock_open'}
          </span>
        </div>
        <h3 className="font-display font-bold text-on-surface text-center text-lg mb-2">
          {isBlocking ? 'Block Slot' : 'Unblock Slot'}
        </h3>
        <p className="text-sm text-on-surface-variant text-center mb-6">
          {isBlocking ? `Block the slot on ${slot.date} at ${slot.start_time}?` : `Unblock the slot on ${slot.date} at ${slot.start_time}?`}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={blocking} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
            {blocking ? 'Processing...' : isBlocking ? 'Block' : 'Unblock'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SLOT_COLUMNS = [
  { header: 'Court', key: 'court_name', width: 20 },
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Start Time', key: 'start_time', width: 12 },
  { header: 'End Time', key: 'end_time', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Peak', key: 'is_peak', width: 10 },
];

export default function AdminSlots() {
  const [courts, setCourts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toLocalISODate(new Date()));
  const [generateModal, setGenerateModal] = useState(false);
  const [blockModal, setBlockModal] = useState({ open: false, slot: null });
  const [blocking, setBlocking] = useState(false);

  const fetchCourts = async () => {
    try {
      const res = await adminFetch('/api/admin/courts');
      const json = await res.json();
      setCourts(json.data || []);
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/data?table=time_slots');
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourts(); fetchSlots(); }, []);

  const slotsForDate = useMemo(() => {
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  const courtTimeMap = useMemo(() => {
    const map = {};
    slotsForDate.forEach((slot) => {
      if (!map[slot.court_id]) map[slot.court_id] = {};
      map[slot.court_id][slot.start_time] = slot;
    });
    return map;
  }, [slotsForDate]);

  const timeSlots = useMemo(() => {
    const times = new Set(slotsForDate.map((s) => s.start_time));
    return Array.from(times).sort();
  }, [slotsForDate]);

  const handleToggleBlock = (slot) => {
    setBlockModal({ open: true, slot });
  };

  const confirmBlock = async () => {
    setBlocking(true);
    try {
      const newStatus = blockModal.slot.status === 'available' ? 'blocked' : 'available';
      await adminFetch('/api/admin/crud', { method: 'PUT', body: JSON.stringify({ table: 'time_slots', id: blockModal.slot.id, data: { status: newStatus } }) });
      toast.success(newStatus === 'blocked' ? 'Slot blocked' : 'Slot unblocked');
      fetchSlots();
    } catch (err) {
      console.error('Toggle block failed:', err);
      toast.error('Failed to update slot');
    } finally {
      setBlocking(false);
      setBlockModal({ open: false, slot: null });
    }
  };

  const slotDataForExport = useMemo(() => {
    return slotsForDate.map((s) => ({
      court_name: courts.find((c) => c.id === s.court_id)?.name || s.court_id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      is_peak: s.is_peak ? 'Yes' : 'No',
    }));
  }, [slotsForDate, courts]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Time Slot Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Generate and manage court time slots</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={slotDataForExport} columns={SLOT_COLUMNS} filename="time-slots" title="Time Slots Report" />
          <button onClick={() => setGenerateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Generate Slots
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#E8F5E9] border border-[#A5D6A7]" />
          <span className="text-xs text-on-surface-variant">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#FFEBEE] border border-[#EF9A9A]" />
          <span className="text-xs text-on-surface-variant">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-surface-dim border border-outline-variant/30" />
          <span className="text-xs text-on-surface-variant">Blocked</span>
        </div>
      </div>

      {/* Date Picker */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4">
        <div className="flex items-center gap-4">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(toLocalISODate(d)); }} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div className="flex-1 text-center">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            <p className="text-xs text-on-surface-variant mt-1">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(toLocalISODate(d)); }} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Slot Grid */}
      {loading ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-container rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">sports_tennis</span>
          <p className="text-on-surface-variant text-sm">No courts available. Create courts first.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-surface-container/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider sticky left-0 bg-surface-container/60 z-10">Court</th>
                {timeSlots.map((t) => (
                  <th key={t} className="px-2 py-3 text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider min-w-[80px]">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr key={court.id} className="border-t border-outline-variant/15">
                  <td className="px-4 py-2 text-sm font-medium text-on-surface sticky left-0 bg-surface-container-lowest z-10">
                    <div>{court.name}</div>
                    <div className="text-xs text-on-surface-variant capitalize">{court.type}</div>
                  </td>
                  {timeSlots.map((t) => (
                    <td key={t} className="px-2 py-2">
                      <TimeSlotCell slot={courtTimeMap[court.id]?.[t]} onToggleBlock={handleToggleBlock} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GenerateSlotsModal open={generateModal} onClose={() => setGenerateModal(false)} onGenerate={() => { setGenerateModal(false); fetchSlots(); }} courts={courts} />
      <BlockConfirmModal open={blockModal.open} onClose={() => setBlockModal({ open: false, slot: null })} onConfirm={confirmBlock} slot={blockModal.slot} blocking={blocking} />
    </div>
  );
}
