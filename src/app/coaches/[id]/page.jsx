"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const LESSON_TYPES = [
  { value: 'private', label: 'Private', icon: 'person' },
  { value: 'semi_private', label: 'Semi-Private (2-3)', icon: 'group' },
  { value: 'group', label: 'Group (4+)', icon: 'groups' },
  { value: 'clinic', label: 'Clinic', icon: 'school' },
]

const DURATIONS = [
  { value: 1, label: '1 Hour' },
  { value: 1.5, label: '1.5 Hours' },
  { value: 2, label: '2 Hours' },
]

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function StarRating({ rating, size = 'text-[16px]' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined ${size} ${
            star <= Math.round(rating) ? 'text-amber-400' : 'text-on-surface-variant/30'
          }`}
        >
          star
        </span>
      ))}
      <span className="text-on-surface-variant text-sm ml-1">{rating?.toFixed(1)}</span>
    </div>
  )
}

export default function CoachProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [lessonType, setLessonType] = useState('private')
  const [duration, setDuration] = useState(1)
  const [participants, setParticipants] = useState(1)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/coaches/${params.id}`)
      .then(r => r.json())
      .then(res => setCoach(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const totalPrice = coach ? coach.hourly_rate * duration * participants : 0

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return alert('Please select date and time')
    setBooking(true)
    try {
      const res = await fetch('/api/coach-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coach.id,
          date: selectedDate,
          time: selectedTime,
          lesson_type: lessonType,
          duration,
          participants,
          total_price: totalPrice,
        }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        alert(data.error || 'Booking created! Check your email for confirmation.')
      }
    } catch {
      alert('Failed to create booking. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7
    return `${hour.toString().padStart(2, '0')}:00`
  })

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-surface-container rounded w-1/3" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-80 bg-surface-container rounded-3xl" />
                  <div className="h-6 bg-surface-container rounded w-1/2" />
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                </div>
                <div className="h-96 bg-surface-container rounded-3xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!coach) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant">person_off</span>
            <h2 className="text-xl font-display font-bold text-on-surface mt-4">Coach not found</h2>
            <button
              onClick={() => router.push('/coaches')}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
            >
              Browse Coaches
            </button>
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

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-sm font-medium">Back to Coaches</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Coach Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photo */}
              <div className="relative h-80 rounded-3xl overflow-hidden">
                <img
                  src={coach.photo_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&q=75'}
                  alt={coach.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name & Rating */}
              <div>
                <h1 className="text-3xl font-display font-bold text-on-surface mb-2">{coach.name}</h1>
                <StarRating rating={coach.rating} size="text-[20px]" />
              </div>

              {/* Bio */}
              {coach.bio && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-2">About</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{coach.bio}</p>
                </div>
              )}

              {/* Certifications */}
              {coach.certifications?.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-3">Certifications</h2>
                  <div className="flex flex-wrap gap-2">
                    {coach.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B5E20]/10 text-[#1B5E20] text-xs font-semibold"
                      >
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {coach.specialties?.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-3">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate */}
              <div className="flex items-baseline gap-2">
                <span className="text-[#1B5E20] font-bold text-2xl">{formatPrice(coach.hourly_rate)}</span>
                <span className="text-on-surface-variant text-sm">per hour</span>
              </div>
            </div>

            {/* Right: Booking Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 shadow-lg">
                <h2 className="font-display font-bold text-lg text-on-surface mb-5">Book a Lesson</h2>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Date</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Time</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">schedule</span>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] cursor-pointer"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lesson Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Lesson Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LESSON_TYPES.map((lt) => (
                      <button
                        key={lt.value}
                        onClick={() => setLessonType(lt.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-colors ${
                          lessonType === lt.value
                            ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{lt.icon}</span>
                        {lt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Duration</label>
                  <div className="flex gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                          duration === d.value
                            ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Participants</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="text-on-surface font-bold text-lg w-8 text-center">{participants}</span>
                    <button
                      onClick={() => setParticipants(Math.min(8, participants + 1))}
                      className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-xl bg-surface-container mb-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Rate</span>
                    <span className="text-on-surface">{formatPrice(coach.hourly_rate)}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Duration</span>
                    <span className="text-on-surface">{duration}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Participants</span>
                    <span className="text-on-surface">×{participants}</span>
                  </div>
                  <div className="border-t border-outline-variant/20 pt-2 flex justify-between">
                    <span className="font-bold text-on-surface">Total</span>
                    <span className="font-bold text-[#1B5E20] text-lg">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {booking ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      Book Lesson
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
