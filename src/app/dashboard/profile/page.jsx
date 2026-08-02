"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import { userFetch } from '@/lib/userFetch'

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setEmail(session.user.email || '')

      userFetch('/api/users/profile')
        .then(r => r.json())
        .then(res => {
          if (res.data) {
            setProfile(res.data)
            setFirstName(res.data.first_name || '')
            setLastName(res.data.last_name || '')
            setPhone(res.data.phone || '')
            setAvatarUrl(res.data.avatar_url || '')
            setAvatarPreview(res.data.avatar_url || '')
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [router])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    let newAvatarUrl = avatarUrl

    if (avatarPreview && avatarPreview !== avatarUrl && avatarPreview.startsWith('data:')) {
      const fileInput = fileInputRef.current
      if (fileInput?.files?.[0]) {
        const file = fileInput.files[0]
        const ext = file.name.split('.').pop()
        const fileName = `${user.id}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          newAvatarUrl = urlData.publicUrl
        }
      }
    }

    try {
      const res = await userFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          avatar_url: newAvatarUrl,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setAvatarUrl(newAvatarUrl)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    }
    setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message })
      } else {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="max-w-2xl mx-auto animate-pulse space-y-6">
              <div className="h-8 bg-surface-container rounded-full w-48" />
              <div className="h-40 bg-surface-container rounded-3xl" />
              <div className="h-64 bg-surface-container rounded-3xl" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface">Edit Profile</h1>
              <p className="text-on-surface-variant mt-2">Update your personal information.</p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 mb-6">
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#1B5E20]/10 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[#1B5E20] text-[36px]">person</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center hover:bg-[#1B5E20]/90 transition-colors shadow-md"
                  >
                    <span className="material-symbols-outlined text-white text-[16px]">edit</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">Profile Photo</p>
                  <p className="text-on-surface-variant text-sm">Click the edit icon to upload</p>
                </div>
              </div>

              {/* Message */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-on-surface mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-on-surface mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-high text-sm text-on-surface-variant border border-outline-variant/20 cursor-not-allowed"
                />
                <p className="text-xs text-on-surface-variant mt-1.5">Email cannot be changed here.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Change Password */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px]">lock</span>
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-on-surface">Change Password</h2>
                  <p className="text-on-surface-variant text-sm">Update your account password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword}>
                {passwordMessage.text && (
                  <div className={`mb-5 p-4 rounded-2xl text-sm font-medium ${
                    passwordMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || !confirmNewPassword}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
