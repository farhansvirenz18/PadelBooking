"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { userFetch } from '@/lib/userFetch'

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
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  const [partnerName, setPartnerName] = useState('')
  const [partnerLevel, setPartnerLevel] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/tournaments/${params.id}`)
      .then(r => r.json())
      .then(res => setTournament(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const handleRegister = async () => {
    if (!partnerName.trim()) return alert('Please enter your partner name')
    if (!partnerLevel) return alert('Please select your partner level')
    setRegistering(true)
    try {
      const res = await userFetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        body: JSON.stringify({
          partnerName,
          partnerLevel,
        }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        alert(data.error || 'Registration successful! Check your email.')
      }
    } catch {
      alert('Failed to register. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 animate-pulse space-y-6">
            <div className="h-8 bg-surface-container rounded w-1/3" />
            <div className="h-64 bg-surface-container rounded-3xl" />
            <div className="h-6 bg-surface-container rounded w-1/2" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!tournament) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant">emoji_events</span>
            <h2 className="text-xl font-display font-bold text-on-surface mt-4">Tournament not found</h2>
            <button
              onClick={() => router.push('/tournaments')}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
            >
              Browse Tournaments
            </button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const spotsLeft = (tournament.max_participants || 0) - (tournament.current_participants || 0)
  const isRegisterable = tournament.status === 'registering' && spotsLeft > 0

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
            <span className="text-sm font-medium">Back to Tournaments</span>
          </button>

          {/* Hero Banner */}
          <div className="relative h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] mb-8">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=75')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
              <span className="material-symbols-outlined text-[56px] mb-3">emoji_events</span>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{tournament.name}</h1>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${
                tournament.status === 'registering' ? 'bg-[#1B5E20]/80' :
                tournament.status === 'upcoming' ? 'bg-blue-500/80' :
                tournament.status === 'completed' ? 'bg-gray-500/80' : 'bg-amber-500/80'
              }`}>
                {tournament.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Tournament Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              {tournament.description && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-2">About</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{tournament.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-center">
                  <span className="material-symbols-outlined text-[24px] text-[#1B5E20] mb-1">calendar_today</span>
                  <p className="text-on-surface text-xs font-semibold">Date</p>
                   <p className="text-on-surface-variant text-[11px]">{formatDate(tournament.tournament_date)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-center">
                  <span className="material-symbols-outlined text-[24px] text-[#1B5E20] mb-1">trophy</span>
                  <p className="text-on-surface text-xs font-semibold">Format</p>
                  <p className="text-on-surface-variant text-[11px]">{FORMAT_LABELS[tournament.format] || tournament.format}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-center">
                  <span className="material-symbols-outlined text-[24px] text-[#1B5E20] mb-1">group</span>
                  <p className="text-on-surface text-xs font-semibold">Participants</p>
                  <p className="text-on-surface-variant text-[11px]">{tournament.current_participants}/{tournament.max_participants}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-center">
                  <span className="material-symbols-outlined text-[24px] text-[#1B5E20] mb-1">signal_cellular_alt</span>
                  <p className="text-on-surface text-xs font-semibold">Level Range</p>
                  <p className="text-on-surface-variant text-[11px]">{tournament.min_level || 1} - {tournament.max_level || 5}</p>
                </div>
              </div>

              {/* Fees & Prize */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">paid</span>
                    <span className="text-on-surface-variant text-sm">Entry Fee</span>
                  </div>
                  <p className="text-[#1B5E20] font-bold text-2xl">{formatPrice(tournament.entry_fee)}</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[20px] text-amber-500">emoji_events</span>
                    <span className="text-on-surface-variant text-sm">Prize Pool</span>
                  </div>
                  <p className="text-amber-500 font-bold text-2xl">{formatPrice(tournament.prize_pool)}</p>
                </div>
              </div>

              {/* Rules */}
              {tournament.rules && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-3">Rules</h2>
                  <div className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                    {tournament.rules}
                  </div>
                </div>
              )}

              {/* Registered Participants */}
              {tournament.participants?.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-3">
                    Registered Participants ({tournament.participants.length})
                  </h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tournament.participants.map((p, i) => (
                      <div
                        key={p.id || i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                        <div className="flex-1">
                          <p className="text-sm text-on-surface font-medium">{p.user_name || p.name}</p>
                          <p className="text-[11px] text-on-surface-variant">Level {p.level || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Registration Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 shadow-lg">
                <h2 className="font-display font-bold text-lg text-on-surface mb-1">Register for Tournament</h2>
                <p className="text-on-surface-variant text-xs mb-5">Teams of 2 players</p>

                {isRegisterable ? (
                  <>
                    {/* Partner Name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Partner Name</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
                        <input
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Enter partner's name"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Partner Level */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Partner Level</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">signal_cellular_alt</span>
                        <select
                          value={partnerLevel}
                          onChange={(e) => setPartnerLevel(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] cursor-pointer"
                        >
                          <option value="">Select level</option>
                          {[1, 2, 3, 4, 5].map((l) => (
                            <option key={l} value={l}>Level {l}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="p-4 rounded-xl bg-surface-container mb-5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Entry Fee</span>
                        <span className="text-on-surface font-semibold">{formatPrice(tournament.entry_fee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Participants</span>
                        <span className="text-on-surface">×2</span>
                      </div>
                      <div className="border-t border-outline-variant/20 pt-2 flex justify-between">
                        <span className="font-bold text-on-surface">Total</span>
                        <span className="font-bold text-[#1B5E20] text-lg">{formatPrice(tournament.entry_fee * 2)}</span>
                      </div>
                    </div>

                    {/* Register Button */}
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {registering ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                          Register & Pay
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2">block</span>
                    <p className="text-on-surface-variant text-sm">
                      {tournament.status === 'completed'
                        ? 'This tournament has ended.'
                        : spotsLeft === 0
                        ? 'This tournament is full.'
                        : 'Registration is not open yet.'}
                    </p>
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
