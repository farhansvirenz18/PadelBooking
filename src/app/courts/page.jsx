"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const AMENITY_ICONS = {
  parking: 'local_parking',
  wifi: 'wifi',
  locker: 'lock',
  shower: 'shower_head',
  cafe: 'local_cafe',
  lighting: 'light_mode',
  floodlight: 'floodlight',
  ac: 'ac_unit',
  pro_shop: 'store',
  viewing: 'visibility',
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

export default function CourtsPage() {
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    fetch('/api/courts')
      .then(r => r.json())
      .then(res => setCourts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...courts]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q))
    }

    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter)
    }

    if (sortBy === 'price-low') result.sort((a, b) => a.price_per_hour_offpeak - b.price_per_hour_offpeak)
    else if (sortBy === 'price-high') result.sort((a, b) => b.price_per_hour_offpeak - a.price_per_hour_offpeak)
    else result.sort((a, b) => a.name.localeCompare(b.name))

    return result
  }, [courts, search, typeFilter, sortBy])

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* Header */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-2">
            Browse Courts
          </h1>
          <p className="text-on-surface-variant">
            Find the perfect padel court and book your session instantly.
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
                placeholder="Search courts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              {['all', 'indoor', 'outdoor'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                    typeFilter === t
                      ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] cursor-pointer"
            >
              <option value="name">Sort: Name</option>
              <option value="price-low">Sort: Price Low → High</option>
              <option value="price-high">Sort: Price High → Low</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-6">
          <p className="text-on-surface-variant text-sm">
            {loading ? 'Loading...' : `${filtered.length} court${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden animate-pulse">
                  <div className="h-52 bg-surface-container" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container rounded-full w-3/4" />
                    <div className="h-4 bg-surface-container rounded-full w-1/2" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-8 w-8 bg-surface-container rounded-lg" />
                      <div className="h-8 w-8 bg-surface-container rounded-lg" />
                      <div className="h-8 w-8 bg-surface-container rounded-lg" />
                    </div>
                    <div className="h-10 bg-surface-container rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">search_off</span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">No courts found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">
                Try adjusting your search or filters to find available courts.
              </p>
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); setSortBy('name') }}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((court) => {
                const amenities = court.amenities || []
                return (
                  <div
                    key={court.id}
                    className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden hover:shadow-xl hover:shadow-[#1B5E20]/8 transition-all duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={court.image_url || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75'}
                        alt={court.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1B5E20] text-white text-xs font-semibold capitalize backdrop-blur-sm">
                        {court.type}
                      </span>
                      {court.status === 'maintenance' && (
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
                          Maintenance
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display font-bold text-lg text-on-surface mb-1 group-hover:text-[#1B5E20] transition-colors">
                        {court.name}
                      </h3>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-3">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {court.location || 'Jakarta'}
                      </div>

                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {amenities.slice(0, 5).map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container text-[10px] font-medium text-on-surface-variant capitalize"
                              title={a}
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                {AMENITY_ICONS[a] || 'check_circle'}
                              </span>
                              {a}
                            </span>
                          ))}
                          {amenities.length > 5 && (
                            <span className="px-2 py-0.5 rounded-lg bg-surface-container text-[10px] font-medium text-on-surface-variant">
                              +{amenities.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto">
                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-[#1B5E20] font-bold text-xl">
                            {formatPrice(court.price_per_hour_offpeak)}
                          </span>
                          <span className="text-on-surface-variant text-xs">/hour</span>
                        </div>

                        {/* Book button */}
                        <Link
                          href={`/book/${court.id}`}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20"
                        >
                          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                          Book Now
                        </Link>
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
