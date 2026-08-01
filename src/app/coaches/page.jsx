"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const SPECIALTIES = [
  'all', 'forehand', 'backhand', 'volley', 'serve', 'smash',
  'defense', 'tactical', 'fitness', 'beginner', 'advanced'
]

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined text-[16px] ${
            star <= Math.round(rating) ? 'text-amber-400' : 'text-on-surface-variant/30'
          }`}
        >
          star
        </span>
      ))}
      <span className="text-on-surface-variant text-xs ml-1">{rating?.toFixed(1)}</span>
    </div>
  )
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  useEffect(() => {
    fetch('/api/coaches')
      .then(r => r.json())
      .then(res => setCoaches(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...coaches]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q))
    }

    if (specialtyFilter !== 'all') {
      result = result.filter(c => (c.specialties || []).includes(specialtyFilter))
    }

    return result
  }, [coaches, search, specialtyFilter])

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* Header */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-2">
            Browse Coaches
          </h1>
          <p className="text-on-surface-variant">
            Find expert padel coaches to elevate your game.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search coaches by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
              />
            </div>

            {/* Specialty filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialtyFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                    specialtyFilter === s
                      ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-6">
          <p className="text-on-surface-variant text-sm">
            {loading ? 'Loading...' : `${filtered.length} coach${filtered.length !== 1 ? 'es' : ''} found`}
          </p>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden animate-pulse">
                  <div className="h-52 bg-surface-container" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container rounded-full w-3/4" />
                    <div className="h-4 bg-surface-container rounded-full w-1/2" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 w-16 bg-surface-container rounded-full" />
                      <div className="h-6 w-20 bg-surface-container rounded-full" />
                    </div>
                    <div className="h-10 bg-surface-container rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">person_off</span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">No coaches found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">
                Try adjusting your search or filters to find available coaches.
              </p>
              <button
                onClick={() => { setSearch(''); setSpecialtyFilter('all') }}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((coach) => (
                <div
                  key={coach.id}
                  className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden hover:shadow-xl hover:shadow-[#1B5E20]/8 transition-all duration-300 flex flex-col"
                >
                  {/* Photo */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={coach.photo_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=75'}
                      alt={coach.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#1B5E20] text-white text-xs font-semibold backdrop-blur-sm">
                      {formatPrice(coach.hourly_rate)}/hr
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display font-bold text-lg text-on-surface mb-1 group-hover:text-[#1B5E20] transition-colors">
                      {coach.name}
                    </h3>

                    <StarRating rating={coach.rating} />

                    {/* Specialties */}
                    {coach.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {coach.specialties.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg bg-[#1B5E20]/10 text-[#1B5E20] text-[10px] font-semibold capitalize"
                          >
                            {s}
                          </span>
                        ))}
                        {coach.specialties.length > 4 && (
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[10px] font-medium">
                            +{coach.specialties.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Link
                        href={`/coaches/${coach.id}`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        Book
                      </Link>
                    </div>
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
