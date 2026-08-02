"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import { userFetch } from '@/lib/userFetch'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming', icon: 'event' },
  { key: 'past', label: 'Past', icon: 'history' },
  { key: 'cancelled', label: 'Cancelled', icon: 'cancel' },
]

export default function BookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancellingId, setCancellingId] = useState(null)

  function fetchBookings() {
    setLoading(true)
    userFetch('/api/bookings')
      .then(r => r.json())
      .then(res => setBookings(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      fetchBookings()
    })
  }, [router])

  const today = new Date().toISOString().split('T')[0]

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') return b.status !== 'cancelled' && b.time_slots?.date >= today
    if (activeTab === 'past') return b.status !== 'cancelled' && b.time_slots?.date < today
    if (activeTab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  async function handleCancel(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      const res = await userFetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      }
    } catch {}
    setCancellingId(null)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface">My Bookings</h1>
            <p className="text-on-surface-variant mt-2">Manage your padel court reservations.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {TABS.map((tab) => {
              const count = bookings.filter(b => {
                if (tab.key === 'upcoming') return b.status !== 'cancelled' && b.time_slots?.date >= today
                if (tab.key === 'past') return b.status !== 'cancelled' && b.time_slots?.date < today
                if (tab.key === 'cancelled') return b.status === 'cancelled'
                return false
              }).length
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-surface-container-lowest'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-surface-container rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                  {activeTab === 'upcoming' ? 'event_available' : activeTab === 'past' ? 'history' : 'event_busy'}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">
                No {activeTab} bookings
              </h3>
              <p className="text-on-surface-variant text-sm max-w-sm mb-6">
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming bookings. Let's book a court!"
                  : activeTab === 'past'
                  ? "You haven't completed any bookings yet."
                  : "You don't have any cancelled bookings."}
              </p>
              {activeTab === 'upcoming' && (
                <Link
                  href="/courts"
                  className="px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
                >
                  Browse Courts
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Court Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#1B5E20] text-[28px]">sports_tennis</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-on-surface">
                            {booking.courts?.name || 'Court'}
                          </h3>
                          <p className="text-on-surface-variant text-sm mt-0.5">
                            {booking.courts?.type} court &middot; {booking.courts?.location || 'Jakarta'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          {formatDate(booking.time_slots?.date)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {booking.time_slots?.start_time} - {booking.time_slots?.end_time}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">payments</span>
                          {formatPrice(booking.total_price)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div className="shrink-0">
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
