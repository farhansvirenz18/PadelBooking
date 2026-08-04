"use client"

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { toast } from 'sonner'
import { userFetch } from '@/lib/userFetch'
import { supabase } from '@/lib/supabaseClient'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

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

export default function MembershipPage() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)
  const [activeMembership, setActiveMembership] = useState(null)

  useEffect(() => {
    fetch('/api/memberships')
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setTiers(res.data)
        }
      })
      .catch((err) => console.error('Failed to fetch tiers', err))
      .finally(() => setLoading(false))

    // Fetch user's active membership
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('user_memberships')
          .select('*, membership_tiers(name)')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single()
          .then(({ data }) => {
            if (data) setActiveMembership(data);
          });
      }
    });
  }, [])

  const handleSubscribe = async (tier) => {
    if (activeMembership && activeMembership.tier_id === tier.id) {
      toast.error(`Anda sudah memiliki paket ${tier.name} yang sedang aktif.`);
      return;
    }

    if (activeMembership) {
      const confirm = window.confirm(`Peringatan: Anda masih memiliki paket ${activeMembership.membership_tiers?.name || 'lama'} aktif sampai ${new Date(activeMembership.end_date).toLocaleDateString('id-ID')}.\n\nJika Anda membeli paket baru, sisa waktu pada paket lama akan HANGUS dan otomatis tergantikan oleh paket baru.\n\nApakah Anda yakin ingin melanjutkan pembelian?`);
      if (!confirm) return;
    }

    setSubscribing(tier.id)
    try {
      const res = await userFetch('/api/memberships/subscribe', {
        method: 'POST',
        body: JSON.stringify({ tierId: tier.id }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error(data.error || 'Subscription created! Check your email for payment details.')
      }
    } catch {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* Header */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-3">
            Membership Plans
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Unlock exclusive perks, save on bookings, and elevate your padel experience.
          </p>
        </div>

        {/* Tiers */}
        <div className="max-w-[1100px] mx-auto px-4 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 p-8 animate-pulse">
                  <div className="h-6 bg-surface-container rounded w-1/3 mb-4" />
                  <div className="h-10 bg-surface-container rounded w-1/2 mb-6" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-surface-container rounded w-full" />
                    ))}
                  </div>
                  <div className="h-12 bg-surface-container rounded-full mt-8" />
                </div>
              ))}
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-20 bg-surface-container rounded-3xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">sentiment_dissatisfied</span>
              <h2 className="text-xl font-display font-bold text-on-surface mb-2">Belum ada Membership</h2>
              <p className="text-on-surface-variant text-sm">Saat ini belum ada paket membership yang tersedia. Silakan cek kembali nanti!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl ${
                    tier.recommended
                      ? 'border-[#1B5E20] shadow-lg shadow-[#1B5E20]/15 bg-surface-container-lowest'
                      : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30'
                  }`}
                >
                  {/* Recommended badge */}
                  {tier.recommended && (
                    <div className="bg-[#1B5E20] text-white text-xs font-bold text-center py-2 uppercase tracking-wider">
                      Recommended
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    {/* Tier name */}
                    <h2 className="font-display font-bold text-xl text-on-surface mb-1">{tier.name}</h2>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-3xl font-display font-bold ${tier.recommended ? 'text-[#1B5E20]' : 'text-on-surface'}`}>
                        {formatPrice(tier.monthly_price)}
                      </span>
                      <span className="text-on-surface-variant text-sm">/month</span>
                    </div>

                    {/* Discount highlight */}
                    <p className="text-[#1B5E20] text-sm font-semibold mb-6">
                      Save {tier.discount_percent}% on bookings
                    </p>

                    {/* Quick perks */}
                    <div className="flex items-center gap-4 mb-6 text-xs text-on-surface-variant">
                      {tier.priority_booking && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#1B5E20]">priority_high</span>
                          Priority Booking
                        </span>
                      )}
                      {tier.free_credits > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#1B5E20]">redeem</span>
                          {tier.free_credits} Free Credits
                        </span>
                      )}
                    </div>

                    {/* Perks list */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-[#1B5E20] mt-0.5">check_circle</span>
                          <span className="text-on-surface-variant text-sm">
                            {PERK_OPTIONS.find((p) => p.value === perk)?.label || perk}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Subscribe button */}
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={subscribing === tier.id}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                        tier.recommended
                          ? 'bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90 shadow-[#1B5E20]/20'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30'
                      }`}
                    >
                      {subscribing === tier.id ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">card_membership</span>
                          Subscribe
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="max-w-[800px] mx-auto px-4 md:px-10 mt-16">
          <h2 className="text-2xl font-display font-bold text-on-surface text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade my plan anytime?',
                a: 'Yes! You can upgrade at any time. The price difference will be prorated for the remaining billing period.',
              },
              {
                q: 'What happens to unused free credits?',
                a: 'Free court credits expire at the end of each billing month and do not roll over.',
              },
              {
                q: 'How do I cancel my subscription?',
                a: 'You can cancel from your dashboard. Your benefits continue until the end of the current billing period.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts! All plans are month-to-month and can be cancelled anytime.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                <h3 className="font-display font-bold text-on-surface mb-2">{faq.q}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
