"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import ExportButton from "@/components/admin/ExportButton";
import { toast } from "sonner";

const FORMATS = [
  { value: "americano", label: "Americano" },
  { value: "mexicano", label: "Mexicano" },
  { value: "round_robin", label: "Round Robin" },
  { value: "single_elimination", label: "Single Elimination" },
  { value: "double_elimination", label: "Double Elimination" },
  { value: "group_knockout", label: "Group + Knockout" },
];

const STATUSES = [
  { value: "upcoming", label: "Upcoming", badge: "bg-blue-100 text-blue-700" },
  { value: "registering", label: "Registering", badge: "bg-green-100 text-green-700" },
  { value: "in_progress", label: "In Progress", badge: "bg-yellow-100 text-yellow-700" },
  { value: "completed", label: "Completed", badge: "bg-gray-100 text-gray-600" },
  { value: "cancelled", label: "Cancelled", badge: "bg-red-100 text-red-600" },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "americano",
    level_min: 1,
    level_max: 5,
    entry_fee: "",
    max_participants: "",
    prize_pool: "",
    tournament_date: "",
    registration_deadline: "",
    rules: "",
    status: "upcoming",
  });

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/tournaments");
      const data = await res.json();
      setTournaments(data.data || []);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const filtered = tournaments.filter((t) => {
    const matchSearch =
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchFormat = !filterFormat || t.format === filterFormat;
    return matchSearch && matchStatus && matchFormat;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      format: "americano",
      level_min: 1,
      level_max: 5,
      entry_fee: "",
      max_participants: "",
      prize_pool: "",
      tournament_date: "",
      registration_deadline: "",
      rules: "",
      status: "upcoming",
    });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || "",
      description: t.description || "",
      format: t.format || "americano",
      level_min: t.level_min || 1,
      level_max: t.level_max || 5,
      entry_fee: t.entry_fee || "",
      max_participants: t.max_participants || "",
      prize_pool: t.prize_pool || "",
      tournament_date: t.tournament_date
        ? new Date(t.tournament_date).toISOString().slice(0, 16)
        : "",
      registration_deadline: t.registration_deadline
        ? new Date(t.registration_deadline).toISOString().slice(0, 16)
        : "",
      rules: t.rules || "",
      status: t.status || "upcoming",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        format: form.format,
        tournament_date: form.tournament_date ? new Date(form.tournament_date).toISOString() : null,
        registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
        entry_fee: parseFloat(form.entry_fee) || 0,
        max_participants: parseInt(form.max_participants) || 0,
        prize_pool: parseFloat(form.prize_pool) || 0,
        level_min: parseInt(form.level_min) || 1,
        level_max: parseInt(form.level_max) || 5,
        rules: form.rules || null,
        status: form.status,
      };

      const url = editing
        ? `/api/admin/tournaments?id=${editing.id}`
        : "/api/admin/tournaments";
      const method = editing ? "PUT" : "POST";

      await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success(editing ? "Tournament updated successfully" : "Tournament created successfully");
      setModalOpen(false);
      fetchTournaments();
    } catch (err) {
      console.error("Failed to save tournament:", err);
      toast.error("Failed to save tournament");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/api/admin/tournaments?id=${id}`, { method: "DELETE" });
      toast.success("Tournament deleted successfully");
      setDeleteConfirm(null);
      fetchTournaments();
    } catch (err) {
      console.error("Failed to delete tournament:", err);
      toast.error("Failed to delete tournament");
    }
  };

  const viewRegistrations = async (tournament) => {
    setRegistrationsOpen(tournament);
    setRegistrations(tournament.registrations || []);
  };

  const getStatusBadge = (status) => {
    const s = STATUSES.find((s) => s.value === status);
    return s ? s.badge : "bg-gray-100 text-gray-600";
  };

  const getFormatLabel = (format) => {
    const f = FORMATS.find((f) => f.value === format);
    return f ? f.label : format;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B5E20] flex items-center gap-3">
              <span className="material-symbols-rounded text-4xl">emoji_events</span>
              Tournament Management
            </h1>
            <p className="text-gray-500 mt-1">Organize and manage padel tournaments</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1B5E20] text-white px-5 py-3 rounded-xl hover:bg-[#2E7D32] transition shadow-md"
          >
            <span className="material-symbols-rounded">add</span>
            New Tournament
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
            >
              <option value="">All Formats</option>
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <ExportButton
              data={filtered}
              filename="tournaments"
              columns={[
                { header: "Name", key: "name" },
                { header: "Format", key: "format", format: (v) => getFormatLabel(v) },
                { header: "Date", key: "tournament_date", format: (v) => v ? new Date(v).toLocaleDateString() : "—" },
                { header: "Participants", key: "participants_count" },
                { header: "Entry Fee", key: "entry_fee" },
                { header: "Prize Pool", key: "prize_pool" },
                { header: "Status", key: "status" },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B5E20] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="material-symbols-rounded text-6xl">emoji_events</span>
            <p className="mt-4 text-lg">No tournaments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="h-2 bg-gradient-to-r from-[#1B5E20] to-[#4CAF50]" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight pr-2">{t.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(t.status)}`}>
                      {STATUSES.find((s) => s.value === t.status)?.label || t.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="material-symbols-rounded text-[#1B5E20] text-lg">category</span>
                      {getFormatLabel(t.format)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="material-symbols-rounded text-[#1B5E20] text-lg">calendar_today</span>
                      {t.tournament_date
                        ? new Date(t.tournament_date).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="material-symbols-rounded text-[#1B5E20] text-lg">group</span>
                      {t.participants_count || 0}/{t.max_participants || "∞"}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="material-symbols-rounded text-[#1B5E20] text-lg">paid</span>
                      Rp {Number(t.entry_fee || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  {t.prize_pool > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm mb-4">
                      <span className="material-symbols-rounded text-lg">emoji_events</span>
                      Prize Pool: <strong>Rp {Number(t.prize_pool).toLocaleString('id-ID')}</strong>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewRegistrations(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#1B5E20] text-[#1B5E20] rounded-xl hover:bg-[#E8F5E9] transition text-sm"
                    >
                      <span className="material-symbols-rounded text-lg">group</span>
                      Players
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm"
                    >
                      <span className="material-symbols-rounded text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(t)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition text-sm"
                    >
                      <span className="material-symbols-rounded text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Tournament" : "New Tournament"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  placeholder="Tournament name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none resize-none"
                  placeholder="Tournament description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  >
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Level</label>
                  <input
                    type="number"
                    value={form.level_min}
                    onChange={(e) => setForm({ ...form, level_min: e.target.value })}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Level</label>
                  <input
                    type="number"
                    value={form.level_max}
                    onChange={(e) => setForm({ ...form, level_max: e.target.value })}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (Rp)</label>
                  <input
                    type="number"
                    value={form.entry_fee}
                    onChange={(e) => setForm({ ...form, entry_fee: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prize Pool (Rp)</label>
                <input
                  type="number"
                  value={form.prize_pool}
                  onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Date</label>
                  <input
                    type="datetime-local"
                    value={form.tournament_date}
                    onChange={(e) => setForm({ ...form, tournament_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.registration_deadline}
                    onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rules</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none resize-none"
                  placeholder="Tournament rules and guidelines..."
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || saving}
                className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl hover:bg-[#2E7D32] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-rounded text-red-500">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Tournament</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {registrationsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Registered Players</h2>
                <p className="text-sm text-gray-500">{registrationsOpen.name}</p>
              </div>
              <button
                onClick={() => { setRegistrationsOpen(null); setRegistrations([]); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="p-6">
              {registrations.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <span className="material-symbols-rounded text-5xl">group_off</span>
                  <p className="mt-3">No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg, i) => (
                    <div
                      key={reg.id || i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                        <span className="material-symbols-rounded text-[#1B5E20]">person</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{reg.user_name || reg.name || `Player ${i + 1}`}</p>
                        <p className="text-xs text-gray-500">{reg.email || "—"}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
