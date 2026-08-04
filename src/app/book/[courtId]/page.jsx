"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { userFetch } from '@/lib/userFetch'

import { supabase } from '@/lib/supabaseClient'

import { toast } from 'sonner'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isToday(d) {
  const now = new Date()
  return toISODate(d) === toISODate(now)
}

function isSlotPast(slot, selectedDate) {
  if (!isToday(selectedDate)) return false
  const now = new Date()
  const [sh, sm] = (slot.start_time || '').split(':').map(Number)
  const slotStartMinutes = (sh || 0) * 60 + (sm || 0)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return slotStartMinutes <= nowMinutes
}

function generateDays(count = 14) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

export default function BookCourtPage() {
  const { courtId } = useParams()
  const router = useRouter()

  const [court, setCourt] = useState(null)
  const [loadingCourt, setLoadingCourt] = useState(true)

  const [days] = useState(() => generateDays(14))
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [coaches, setCoaches] = useState([])
  const [selectedCoachId, setSelectedCoachId] = useState(null)
  const [activeMembership, setActiveMembership] = useState(null)

  const [selectedSlots, setSelectedSlots] = useState([])
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  // Fetch court and coaches
  useEffect(() => {
    setLoadingCourt(true)
    Promise.all([
      fetch(`/api/courts/${courtId}`).then(r => r.json()),
      fetch('/api/coaches').then(r => r.json())
    ])
      .then(([courtRes, coachesRes]) => {
        if (courtRes.success) setCourt(courtRes.data)
        else setError('Court not found')
        
        if (coachesRes.success) setCoaches(coachesRes.data)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoadingCourt(false))

    // Fetch active membership
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('user_memberships')
          .select('*, membership_tiers(*)')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single()
          .then(({ data }) => {
            if (data) setActiveMembership(data)
          })
      }
    })
  }, [courtId])

  // Fetch slots when date changes
  useEffect(() => {
    setSelectedSlots([])
    setLoadingSlots(true)
    fetch(`/api/courts/${courtId}/slots?date=${toISODate(selectedDate)}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setSlots(res.data.slots || [])
        else setSlots([])
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [courtId, selectedDate])

  const toggleSlot = useCallback((slot) => {
    if (slot.status !== 'available') return
    if (isSlotPast(slot, selectedDate)) return
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.id === slot.id)
      if (exists) return prev.filter(s => s.id !== slot.id)
      return [...prev, slot].sort((a, b) => a.start_time.localeCompare(b.start_time))
    })
  }, [selectedDate])

  const selectedCoach = coaches.find(c => c.id === selectedCoachId)
  
  const courtBasePrice = selectedSlots.reduce((sum, s) => {
    return sum + parseFloat(s.price)
  }, 0)
  
  const discountPercent = activeMembership?.membership_tiers?.discount_percent || 0
  const courtDiscount = (courtBasePrice * discountPercent) / 100
  const courtPrice = courtBasePrice - courtDiscount
  
  const coachPrice = selectedCoach ? parseFloat(selectedCoach.hourly_rate) * selectedSlots.length : 0
  const totalPrice = courtPrice + coachPrice

  const totalMinutes = selectedSlots.length * 60

  const timeRange = selectedSlots.length > 0
    ? `${selectedSlots[0]?.start_time?.slice(0, 5)} – ${selectedSlots[selectedSlots.length - 1]?.end_time?.slice(0, 5)}`
    : ''

  const handleProceedToPayment = async () => {
    if (selectedSlots.length === 0) return
    setBooking(true)
    setError('')

    try {
      for (const slot of selectedSlots) {
        const bookRes = await userFetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify({ 
            courtId, 
            timeSlotId: slot.id, 
            date: toISODate(selectedDate),
            coachId: selectedCoachId // Include optional coach
          }),
        })
        const bookData = await bookRes.json()

        if (!bookData.success) {
          setError(bookData.error || 'Booking failed')
          setBooking(false)
          return
        }

        const payRes = await userFetch('/api/payments', {
          method: 'POST',
          body: JSON.stringify({ bookingId: bookData.data.id, type: 'booking' }),
        })
        const payData = await payRes.json()

        if (!payData.success) {
          setError(payData.error || 'Payment initiation failed')
          setBooking(false)
          return
        }

        if (payData.redirect_url) {
          window.location.href = payData.redirect_url
          return
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loadingCourt) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-surface-container rounded-full w-64" />
              <div className="h-40 bg-surface-container rounded-3xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-surface-container rounded-3xl" />
                <div className="h-96 bg-surface-container rounded-3xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error && !court) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">error_outline</span>
            <h2 className="text-xl font-display font-bold text-on-surface mb-2">{error}</h2>
            <Link href="/courts" className="text-[#1B5E20] text-sm font-semibold hover:underline mt-4 inline-block">
              ← Back to Courts
            </Link>
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

          {/* Back link */}
          <Link
            href="/courts"
            className="inline-flex items-center gap-1.5 text-on-surface-variant text-sm hover:text-[#1B5E20] transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Courts
          </Link>

          {/* Court Info Card */}
          {court && (
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-72 h-48 md:h-auto overflow-hidden shrink-0">
                  <img
                    src={court.image_url || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75'}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-display font-bold text-on-surface">{court.name}</h1>
                    <span className="px-3 py-0.5 rounded-full bg-[#1B5E20]/10 text-[#1B5E20] text-xs font-semibold capitalize">
                      {court.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant text-sm mb-4">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {court.location || 'Jakarta'}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1B5E20] font-bold text-2xl">{formatPrice(court.price_per_hour_offpeak)}</span>
                    <span className="text-on-surface-variant text-sm">/hour</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Date + Time Slots */}
            <div className="lg:col-span-2 space-y-8">

              {/* Date Picker */}
              <section>
                <h2 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[22px]">calendar_today</span>
                  Select Date
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((d) => {
                    const isSelected = toISODate(d) === toISODate(selectedDate)
                    const isToday = toISODate(d) === toISODate(new Date())
                    return (
                      <button
                        key={toISODate(d)}
                        onClick={() => setSelectedDate(d)}
                        className={`flex flex-col items-center min-w-[72px] px-3 py-3 rounded-2xl transition-all duration-200 shrink-0 ${
                          isSelected
                            ? 'bg-[#1B5E20] text-white shadow-lg shadow-[#1B5E20]/25'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? 'text-white/70' : 'text-on-surface-variant'}`}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xl font-bold mt-0.5">{d.getDate()}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-on-surface-variant'}`}>
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        {isToday && (
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#1B5E20]'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Time Slots */}
              <section>
                <h2 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[22px]">schedule</span>
                  Available Time Slots
                </h2>

                {loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3 block">event_busy</span>
                    <p className="text-on-surface-variant text-sm">No slots available for this date.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#1B5E20]" /> Available
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500" /> Booked
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-gray-400" /> Blocked
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#1B5E20] ring-2 ring-[#1B5E20]/40" /> Selected
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {slots.map((slot) => {
                        const isSelected = selectedSlots.some(s => s.id === slot.id)
                        const isAvailable = slot.status === 'available'
                        const isBooked = slot.status === 'booked'
                        const isBlocked = slot.status === 'blocked'
                        const past = isSlotPast(slot, selectedDate)

                        let bg = 'bg-surface-container'
                        let text = 'text-on-surface-variant'
                        let border = 'border-outline-variant/20'
                        let cursor = 'cursor-not-allowed opacity-50'

                        if (past) {
                          bg = 'bg-gray-100'
                          text = 'text-gray-400'
                          border = 'border-gray-200'
                          cursor = 'cursor-not-allowed opacity-40'
                        } else if (isAvailable && !isSelected) {
                          bg = 'bg-[#1B5E20]/10'
                          text = 'text-[#1B5E20]'
                          border = 'border-[#1B5E20]/30'
                          cursor = 'cursor-pointer hover:bg-[#1B5E20]/20 hover:border-[#1B5E20]/50'
                        }
                        if (isSelected) {
                          bg = 'bg-[#1B5E20]'
                          text = 'text-white'
                          border = 'border-[#1B5E20] shadow-md shadow-[#1B5E20]/20'
                          cursor = 'cursor-pointer'
                        }
                        if (isBooked) {
                          bg = 'bg-red-500/10'
                          text = 'text-red-500'
                          border = 'border-red-500/30'
                        }
                        if (isBlocked) {
                          bg = 'bg-gray-400/10'
                          text = 'text-gray-400'
                          border = 'border-gray-400/30'
                        }

                        return (
                          <button
                            key={slot.id}
                            onClick={() => toggleSlot(slot)}
                            disabled={!isAvailable || past}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border ${bg} ${text} ${border} ${cursor} transition-all duration-150`}
                          >
                            <span className="text-sm font-bold">
                              {slot.start_time?.slice(0, 5)}
                            </span>
                            {past && (
                              <span className="text-[9px] font-semibold mt-0.5 text-gray-400">
                                Expired
                              </span>
                            )}
                            {!past && slot.is_peak && (
                              <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-white/80' : 'text-amber-500'}`}>
                                PEAK
                              </span>
                            )}
                            {isAvailable && !past && (
                              <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#1B5E20]/70'}`}>
                                {formatPrice(slot.price)}
                              </span>
                            )}
                            {isBooked && <span className="text-[10px] mt-0.5">Booked</span>}
                            {isBlocked && <span className="text-[10px] mt-0.5">N/A</span>}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </section>

              {/* Optional Coach Selection */}
              {coaches.length > 0 && selectedSlots.length > 0 && (
                <section>
                  <h2 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1B5E20] text-[22px]">sports</span>
                    Optional: Add a Coach
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setSelectedCoachId(null)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                        selectedCoachId === null
                          ? 'bg-[#1B5E20]/10 border-[#1B5E20] text-[#1B5E20] ring-2 ring-[#1B5E20]/40'
                          : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-[#1B5E20]/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">person_off</span>
                      <span className="font-semibold text-sm">No Coach</span>
                      <span className="text-xs mt-1">Court only</span>
                    </button>
                    
                    {coaches.map(coach => (
                      <button
                        key={coach.id}
                        onClick={() => setSelectedCoachId(coach.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                          selectedCoachId === coach.id
                            ? 'bg-[#1B5E20]/10 border-[#1B5E20] text-[#1B5E20] ring-2 ring-[#1B5E20]/40'
                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-[#1B5E20]/50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
                          <img
                            src={coach.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name || 'Coach')}&background=1B5E20&color=fff`}
                            alt={coach.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-sm line-clamp-1">{coach.name}</span>
                        <span className="text-[10px] text-on-surface-variant line-clamp-1 mb-1">{coach.specialties?.[0] || 'Padel Coach'}</span>
                        <span className="text-xs font-bold text-[#1B5E20]">+{formatPrice(coach.hourly_rate)}/hr</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 p-6">
                <h2 className="text-lg font-display font-bold text-on-surface mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[22px]">receipt_long</span>
                  Order Summary
                </h2>

                {selectedSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3 block">touch_app</span>
                    <p className="text-on-surface-variant text-sm">
                      Select time slots to see your booking summary.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Court */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                      <span className="material-symbols-outlined text-[#1B5E20] text-[20px] mt-0.5">sports_tennis</span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{court?.name}</p>
                        <p className="text-xs text-on-surface-variant capitalize">{court?.type} court</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                      <span className="material-symbols-outlined text-[#1B5E20] text-[20px] mt-0.5">calendar_today</span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{formatDate(selectedDate)}</p>
                        <p className="text-xs text-on-surface-variant">{timeRange}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                      <span className="material-symbols-outlined text-[#1B5E20] text-[20px] mt-0.5">timer</span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} · {totalMinutes} min
                        </p>
                        <p className="text-xs text-on-surface-variant">{selectedSlots.length} × {formatPrice(selectedSlots[0]?.price)}</p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="border-t border-outline-variant/15 pt-4 space-y-2">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Court Fee</span>
                        <span className={courtDiscount > 0 ? 'line-through opacity-70' : ''}>{formatPrice(courtBasePrice)}</span>
                      </div>
                      {courtDiscount > 0 && (
                        <div className="flex justify-between text-xs text-[#1B5E20] font-semibold">
                          <span>Membership Discount ({discountPercent}%)</span>
                          <span>-{formatPrice(courtDiscount)}</span>
                        </div>
                      )}
                      {selectedCoach && (
                        <div className="flex justify-between text-xs text-on-surface-variant">
                          <span>Coach ({selectedCoach.name})</span>
                          <span>{formatPrice(coachPrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-outline-variant/15 pt-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-on-surface">Total</span>
                        <span className="text-2xl font-bold text-[#1B5E20]">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-red-500 text-xs font-medium">{error}</p>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={handleProceedToPayment}
                      disabled={booking || selectedSlots.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#1B5E20]/20"
                    >
                      {booking ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">payment</span>
                          Proceed to Payment
                        </>
                      )}
                    </button>
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
