"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import ExportButton from "@/components/admin/ExportButton";

const SPECIALTIES = ["beginners", "intermediate", "advanced", "kids", "women"];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    specialties: [],
    certifications: "",
    hourly_rate: "",
    image: null,
    is_active: true,
  });

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/coaches");
      const data = await res.json();
      setCoaches(data.coaches || data || []);
    } catch (err) {
      console.error("Failed to fetch coaches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const filtered = coaches.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.bio?.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty =
      !filterSpecialty || c.specialties?.includes(filterSpecialty);
    const matchStatus =
      filterStatus === "" ||
      (filterStatus === "active" && c.is_active) ||
      (filterStatus === "inactive" && !c.is_active);
    return matchSearch && matchSpecialty && matchStatus;
  });

  const openCreate = () => {
    setEditingCoach(null);
    setForm({
      name: "",
      bio: "",
      specialties: [],
      certifications: "",
      hourly_rate: "",
      image: null,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (coach) => {
    setEditingCoach(coach);
    setForm({
      name: coach.name || "",
      bio: coach.bio || "",
      specialties: coach.specialties || [],
      certifications: coach.certifications || "",
      hourly_rate: coach.hourly_rate || "",
      image: null,
      is_active: coach.is_active !== false,
    });
    setModalOpen(true);
  };

  const toggleSpecialty = (spec) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("bio", form.bio);
      formData.append("specialties", JSON.stringify(form.specialties));
      formData.append("certifications", form.certifications);
      formData.append("hourly_rate", form.hourly_rate);
      formData.append("is_active", form.is_active);
      if (form.image) formData.append("image", form.image);

      const url = editingCoach
        ? `/api/admin/coaches/${editingCoach.id}`
        : "/api/admin/coaches";
      const method = editingCoach ? "PUT" : "POST";

      await adminFetch(url, { method, body: formData });
      setModalOpen(false);
      fetchCoaches();
    } catch (err) {
      console.error("Failed to save coach:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/api/admin/coaches/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchCoaches();
    } catch (err) {
      console.error("Failed to delete coach:", err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`material-symbols-rounded text-sm ${i < full ? "text-amber-400" : "text-gray-300"}`}>
          star
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B5E20] flex items-center gap-3">
              <span className="material-symbols-rounded text-4xl">coordinator</span>
              Coach Management
            </h1>
            <p className="text-gray-500 mt-1">Manage your coaching staff and their profiles</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1B5E20] text-white px-5 py-3 rounded-xl hover:bg-[#2E7D32] transition shadow-md"
          >
            <span className="material-symbols-rounded">add</span>
            Add Coach
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
                placeholder="Search coaches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent outline-none"
              />
            </div>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ExportButton
              data={filtered}
              filename="coaches"
              columns={[
                { header: "Name", key: "name" },
                { header: "Specialties", key: "specialties", format: (v) => v?.join(", ") },
                { header: "Hourly Rate", key: "hourly_rate" },
                { header: "Rating", key: "rating" },
                { header: "Status", key: "is_active", format: (v) => (v ? "Active" : "Inactive") },
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
            <span className="material-symbols-rounded text-6xl">person_off</span>
            <p className="mt-4 text-lg">No coaches found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((coach) => (
              <div
                key={coach.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {coach.image || coach.photo ? (
                        <img
                          src={coach.image || coach.photo}
                          alt={coach.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-rounded text-[#1B5E20] text-2xl">
                          person
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{coach.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(coach.rating)}
                        <span className="text-xs text-gray-400 ml-1">
                          ({coach.rating?.toFixed(1) || "0.0"})
                        </span>
                      </div>
                      <p className="text-[#1B5E20] font-semibold mt-1">
                        ${coach.hourly_rate}/hr
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        coach.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {coach.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {coach.bio && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{coach.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {coach.specialties?.map((spec) => (
                      <span
                        key={spec}
                        className="px-2.5 py-1 bg-[#E8F5E9] text-[#1B5E20] rounded-lg text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(coach)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#1B5E20] text-[#1B5E20] rounded-xl hover:bg-[#E8F5E9] transition text-sm"
                    >
                      <span className="material-symbols-rounded text-lg">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(coach)}
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
                {editingCoach ? "Edit Coach" : "Add New Coach"}
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
                  placeholder="Coach name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none resize-none"
                  placeholder="Brief bio..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialty(spec)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        form.specialties.includes(spec)
                          ? "bg-[#1B5E20] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                <input
                  type="text"
                  value={form.certifications}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  placeholder="e.g. PTR Level 3, USPTA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($) *</label>
                  <input
                    type="number"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#E8F5E9] file:text-[#1B5E20] file:font-medium file:cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-12 h-6 rounded-full transition ${
                    form.is_active ? "bg-[#1B5E20]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.is_active ? "translate-x-6" : ""
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.is_active ? "Active" : "Inactive"}
                </span>
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
                disabled={!form.name || !form.hourly_rate || saving}
                className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl hover:bg-[#2E7D32] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editingCoach ? "Update" : "Create"}
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
                <h3 className="font-bold text-gray-800">Delete Coach</h3>
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
    </div>
  );
}
