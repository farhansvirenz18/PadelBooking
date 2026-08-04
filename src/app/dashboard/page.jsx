"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import { userFetch } from '@/lib/userFetch'

function toLocalISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [activeMembership, setActiveMembership] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      Promise.all([
        userFetch('/api/users/profile').then(r => r.json()),
        userFetch('/api/bookings').then(r => r.json()),
        supabase
          .from('user_memberships')
          .select('*, membership_tiers(*)')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single()
      ])
        .then(([profileRes, bookingsRes, membershipRes]) => {
          if (profileRes.data) setProfile(profileRes.data)
          if (bookingsRes.data) setBookings(bookingsRes.data)
          if (membershipRes.data) setActiveMembership(membershipRes.data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [router])

  const upcomingBookings = bookings
    .filter(b => b.status !== 'cancelled' && b.time_slots?.date >= toLocalISODate(new Date()))
    .slice(0, 5)

  const totalSpent = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)

  const hasMembership = profile?.membership_status === 'active'

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-surface-container rounded-full w-64" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-surface-container rounded-3xl" />
                ))}
              </div>
              <div className="h-64 bg-surface-container rounded-3xl" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const stats = [
    { icon: 'calendar_month', label: 'Total Bookings', value: bookings.length, color: 'bg-blue-500' },
    { icon: 'upcoming', label: 'Upcoming Bookings', value: upcomingBookings.length, color: 'bg-[#1B5E20]' },
    { icon: 'payments', label: 'Total Spent', value: formatPrice(totalSpent), color: 'bg-purple-500' },
    { icon: 'card_membership', label: 'Active Membership', value: hasMembership ? 'Active' : 'None', color: 'bg-amber-500' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface">
              Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Player'}!
            </h1>
            <p className="text-on-surface-variant mt-2">
              Here&apos;s an overview of your padel activity.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-[20px]">{stat.icon}</span>
                  </div>
                  <span className="text-on-surface-variant text-sm font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl font-display font-bold text-on-surface">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Upcoming Bookings */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold text-on-surface">Upcoming Bookings</h2>
                <Link
                  href="/dashboard/bookings"
                  className="text-[#1B5E20] text-sm font-semibold hover:underline"
                >
                  View All
                </Link>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">event_busy</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">No upcoming bookings</p>
                  <Link
                    href="/courts"
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
                  >
                    Book a Court
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#1B5E20] text-[22px]">sports_tennis</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">
                          {booking.courts?.name || 'Court'}
                        </p>
                        <p className="text-on-surface-variant text-xs">
                          {formatDate(booking.time_slots?.date)} &middot; {booking.time_slots?.start_time} - {booking.time_slots?.end_time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* My Membership */}
              {activeMembership && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white shadow-lg shadow-[#1B5E20]/20">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-display font-bold">My Membership</h2>
                    <span className="material-symbols-outlined text-[24px] opacity-80">workspace_premium</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs text-white/70 uppercase tracking-wider font-semibold mb-1">Current Tier</p>
                    <p className="text-2xl font-bold font-display">{activeMembership.membership_tiers?.name || 'Active Plan'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80 mb-6 bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="material-symbols-outlined text-[18px]">event_available</span>
                    Valid until: {formatDate(activeMembership.end_date)}
                  </div>
                  <Link
                    href="/membership"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white text-[#1B5E20] text-sm font-bold hover:bg-white/90 transition-colors"
                  >
                    Manage / Upgrade
                  </Link>
                </div>
              )}

              {/* Recent Activity */}
              <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15">
                <h2 className="text-lg font-display font-bold text-on-surface mb-6">Recent Activity</h2>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">history</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 8).map((booking) => (
                    <div key={booking.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        booking.status === 'cancelled' ? 'bg-red-500' :
                        booking.status === 'completed' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm text-on-surface truncate">
                          {booking.courts?.name || 'Court'} - {booking.status}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(booking.created_at)} &middot; {formatPrice(booking.total_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
