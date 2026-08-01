"use client"
import { useState, useEffect, useRef } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/users/profile');
      const json = await res.json();
      const data = json.data || json;
      setProfile(data);
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || '',
      });
      setAvatarPreview(data.avatar_url || '');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'uploads');
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setAvatarPreview(json.url);
        setProfile((prev) => ({ ...prev, avatar_url: json.url }));
        setSuccess('Avatar updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError('Failed to upload avatar');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email,
          avatar_url: avatarPreview,
        }),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setSuccess('Profile updated successfully');
        setProfile((prev) => ({ ...prev, ...form, avatar_url: avatarPreview }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.error || 'Failed to update profile');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save profile');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      setPasswordSaving(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });
      if (authError) {
        setPasswordError(authError.message);
      } else {
        setPasswordSuccess('Password updated successfully');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Password change failed:', err);
      setPasswordError('Failed to change password');
      setTimeout(() => setPasswordError(''), 3000);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="space-y-4">
          <div className="h-8 bg-surface-container rounded-lg animate-pulse w-1/3" />
          <div className="h-4 bg-surface-container rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 space-y-4">
          <div className="h-20 bg-surface-container rounded-xl animate-pulse" />
          <div className="h-12 bg-surface-container rounded-xl animate-pulse" />
          <div className="h-12 bg-surface-container rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Admin Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage your profile and account settings</p>
      </div>

      {/* Success/Error Toasts */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E8F5E9] text-[#1B5E20] text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FFEBEE] text-[#C62828] text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Profile Section */}
      <form onSubmit={handleProfileSave} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-display font-bold text-on-surface">Profile Information</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-container">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-on-primary-container">person</span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/50 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[16px]">upload</span>
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} ref={fileInputRef} />
              </label>
              <p className="text-xs text-on-surface-variant mt-1">JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">First Name</label>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Last Name</label>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Last name" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="08123456789" />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="admin@padelbook.com" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end">
          <button type="submit" disabled={saving || uploadingAvatar} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Change Password Section */}
      <form onSubmit={handlePasswordChange} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-display font-bold text-on-surface">Change Password</h2>
        </div>
        <div className="p-6 space-y-5">
          {passwordSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E8F5E9] text-[#1B5E20] text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FFEBEE] text-[#C62828] text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Current Password</label>
            <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Enter current password" />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">New Password</label>
            <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Min. 6 characters" />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Confirm New Password</label>
            <input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} required minLength={6} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" placeholder="Confirm new password" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end">
          <button type="submit" disabled={passwordSaving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
