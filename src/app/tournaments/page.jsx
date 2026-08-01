"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const STATUS_FILTERS = ['all', 'upcoming', 'registering', 'completed']

const STATUS_COLORS = {
  upcoming: 'bg-blue-500',
  registering: 'bg-[#1B5E20]',
  ongoing: 'bg-amber-500',
  completed: 'bg-on-surface-variant',
}

const FORMAT_LABELS = {
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  round_robin: 'Round Robin',
  swiss: 'Swiss',
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(res => setTournaments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tournaments
    return tournaments.filter(t => t.status === statusFilter)
  }, [tournaments, statusFilter])

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* Header */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-2">
            Tournaments
          </h1>
          <p className="text-on-surface-variant">
            Compete with the best padel players. Register for upcoming tournaments.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-8">
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-6">
          <p className="text-on-surface-variant text-sm">
            {loading ? 'Loading...' : `${filtered.length} tournament${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden animate-pulse">
                  <div className="h-44 bg-surface-container" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container rounded-full w-3/4" />
                    <div className="h-4 bg-surface-container rounded-full w-1/2" />
                    <div className="h-4 bg-surface-container rounded-full w-2/3" />
                    <div className="h-10 bg-surface-container rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">emoji_events</span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">No tournaments found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">
                {statusFilter === 'all'
                  ? 'No tournaments available at the moment. Check back later!'
                  : `No ${statusFilter} tournaments. Try a different filter.`}
              </p>
              <button
                onClick={() => setStatusFilter('all')}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                Show All
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tournament) => {
                const spotsLeft = (tournament.max_participants || 0) - (tournament.current_participants || 0)
                return (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden hover:shadow-xl hover:shadow-[#1B5E20]/8 transition-all duration-300 flex flex-col"
                  >
                    {/* Banner */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75')] bg-cover bg-center opacity-30" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                        <span className="material-symbols-outlined text-[48px] mb-2">emoji_events</span>
                        <h3 className="font-display font-bold text-lg leading-tight">{tournament.name}</h3>
                      </div>
                      {/* Status badge */}
                      <span className={`absolute top-3 right-3 px-3 py-1 rounded-full ${STATUS_COLORS[tournament.status] || 'bg-gray-500'} text-white text-xs font-semibold capitalize`}>
                        {tournament.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Format badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B5E20]/10 text-[#1B5E20] text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[12px]">trophy</span>
                          {FORMAT_LABELS[tournament.format] || tournament.format}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
                        <span className="material-symbols-outlined text-[16px]">event</span>
                        {formatDate(tournament.start_date)}
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        <span>{tournament.current_participants || 0}/{tournament.max_participants || 0} participants</span>
                        {spotsLeft > 0 && spotsLeft <= 10 && (
                          <span className="text-amber-500 text-xs font-semibold">({spotsLeft} spots left)</span>
                        )}
                      </div>

                      {/* Fees & Prize */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/15">
                        <div>
                          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Entry Fee</span>
                          <p className="text-[#1B5E20] font-bold text-sm">{formatPrice(tournament.entry_fee)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Prize Pool</span>
                          <p className="text-amber-500 font-bold text-sm">{formatPrice(tournament.prize_pool)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
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
