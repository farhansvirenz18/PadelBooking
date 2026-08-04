"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import { userFetch } from '@/lib/userFetch'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_STYLES = {
  active: { bg: 'bg-green-100 text-green-800', icon: 'check_circle', label: 'Active' },
  expired: { bg: 'bg-gray-100 text-gray-600', icon: 'schedule', label: 'Expired' },
  cancelled: { bg: 'bg-red-100 text-red-800', icon: 'cancel', label: 'Cancelled' },
}

const PAYMENT_STYLES = {
  unpaid: { bg: 'bg-yellow-100 text-yellow-800', icon: 'pending', label: 'Pending Payment' },
  paid: { bg: 'bg-green-100 text-green-800', icon: 'paid', label: 'Paid' },
  refunded: { bg: 'bg-blue-100 text-blue-800', icon: 'currency_exchange', label: 'Refunded' },
}

const TABS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'active', label: 'Active', icon: 'check_circle' },
  { key: 'pending', label: 'Pending', icon: 'pending' },
  { key: 'expired', label: 'Expired', icon: 'schedule' },
]

export default function MyMembershipsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [resumingId, setResumingId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }

      supabase
        .from('user_memberships')
        .select('*, membership_tiers(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (data) setMemberships(data)
          if (error) console.error('Fetch memberships error:', error)
        })
        .finally(() => setLoading(false))
    })
  }, [router])

  const filteredMemberships = memberships.filter(m => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return m.status === 'active' && m.payment_status === 'paid'
    if (activeTab === 'pending') return m.payment_status === 'unpaid'
    if (activeTab === 'expired') return m.status === 'expired' || m.status === 'cancelled'
    return true
  })

  const handleResume = async (membership) => {
    if (!membership.midtrans_order_id) {
      toast.error('No payment link available for this membership.')
      return
    }
    setResumingId(membership.id)
    try {
      const res = await userFetch('/api/memberships/resume', {
        method: 'POST',
        body: JSON.stringify({ membershipId: membership.id }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to resume payment. Please try again.')
    } finally {
      setResumingId(null)
    }
  }

  const getDaysRemaining = (endDate) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">

          {/* Back + Header */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-on-surface-variant text-sm hover:text-[#1B5E20] transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-on-surface">My Memberships</h1>
              <p className="text-on-surface-variant mt-1">Manage your membership subscriptions and payments.</p>
            </div>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Buy Membership
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
            {TABS.map(tab => {
              const count = memberships.filter(m => {
                if (tab.key === 'all') return true
                if (tab.key === 'active') return m.status === 'active' && m.payment_status === 'paid'
                if (tab.key === 'pending') return m.payment_status === 'unpaid'
                if (tab.key === 'expired') return m.status === 'expired' || m.status === 'cancelled'
                return true
              }).length

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 ${
                    activeTab === tab.key
                      ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                  <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-surface-container rounded w-1/3" />
                      <div className="h-4 bg-surface-container rounded w-1/2" />
                      <div className="h-4 bg-surface-container rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMemberships.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/15">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 block">card_membership</span>
              <h2 className="text-xl font-display font-bold text-on-surface mb-2">
                {activeTab === 'all' ? 'No memberships yet' : `No ${activeTab} memberships`}
              </h2>
              <p className="text-on-surface-variant text-sm mb-6">
                {activeTab === 'all'
                  ? 'Purchase a membership plan to unlock exclusive discounts and perks!'
                  : `You don't have any ${activeTab} memberships at the moment.`}
              </p>
              {activeTab === 'all' && (
                <Link
                  href="/membership"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
                >
                  Browse Membership Plans
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMemberships.map(m => {
                const tier = m.membership_tiers
                const statusStyle = STATUS_STYLES[m.status] || STATUS_STYLES.expired
                const paymentStyle = PAYMENT_STYLES[m.payment_status] || PAYMENT_STYLES.unpaid
                const isPending = m.payment_status === 'unpaid'
                const isActive = m.status === 'active' && m.payment_status === 'paid'
                const daysLeft = isActive ? getDaysRemaining(m.end_date) : 0

                return (
                  <div
                    key={m.id}
                    className={`rounded-3xl border overflow-hidden transition-all hover:shadow-lg ${
                      isActive
                        ? 'bg-surface-container-lowest border-[#1B5E20]/30 shadow-md shadow-[#1B5E20]/5'
                        : isPending
                          ? 'bg-surface-container-lowest border-yellow-400/30'
                          : 'bg-surface-container-lowest border-outline-variant/15'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-[#1B5E20]/10' : isPending ? 'bg-yellow-500/10' : 'bg-surface-container'
                        }`}>
                          <span className={`material-symbols-outlined text-[28px] ${
                            isActive ? 'text-[#1B5E20]' : isPending ? 'text-yellow-600' : 'text-on-surface-variant'
                          }`}>
                            workspace_premium
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-display font-bold text-on-surface">
                              {tier?.name || 'Membership Plan'}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusStyle.bg}`}>
                              {statusStyle.label}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${paymentStyle.bg}`}>
                              {paymentStyle.label}
                            </span>
                          </div>

                          {/* Price */}
                          <p className="text-on-surface font-semibold text-sm mb-3">
                            {formatPrice(tier?.monthly_price || 0)}
                            <span className="text-on-surface-variant font-normal"> /month</span>
                          </p>

                          {/* Info grid */}
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-on-surface-variant">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              Start: {formatDate(m.start_date)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">event</span>
                              End: {formatDate(m.end_date)}
                            </div>
                            {isActive && daysLeft > 0 && (
                              <div className="flex items-center gap-1.5 text-[#1B5E20] font-semibold">
                                <span className="material-symbols-outlined text-[14px]">timer</span>
                                {daysLeft} days remaining
                              </div>
                            )}
                            {tier?.discount_percent > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">discount</span>
                                {tier.discount_percent}% court discount
                              </div>
                            )}
                          </div>

                          {/* Active progress bar */}
                          {isActive && (
                            <div className="mt-4">
                              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#1B5E20] transition-all"
                                  style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          {isPending && (
                            <button
                              onClick={() => handleResume(m)}
                              disabled={resumingId === m.id}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                              {resumingId === m.id ? (
                                <>
                                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[14px]">payment</span>
                                  Continue Payment
                                </>
                              )}
                            </button>
                          )}
                          {isActive && (
                            <Link
                              href="/courts"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1B5E20] text-white text-xs font-bold hover:bg-[#1B5E20]/90 transition-colors shadow-md"
                            >
                              <span className="material-symbols-outlined text-[14px]">sports_tennis</span>
                              Book Court
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
