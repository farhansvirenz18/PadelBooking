"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const FEATURES = [
  {
    icon: 'calendar_month',
    title: 'Book Courts',
    desc: 'Reserve your favourite padel court in seconds with real-time availability.',
  },
  {
    icon: 'school',
    title: 'Hire Coaches',
    desc: 'Connect with certified padel coaches for private or group sessions.',
  },
  {
    icon: 'emoji_events',
    title: 'Join Tournaments',
    desc: 'Compete in local and regional padel tournaments to test your skills.',
  },
]

const STEPS = [
  { icon: 'sports_tennis', num: '01', title: 'Choose Court', desc: 'Browse available courts near you' },
  { icon: 'schedule', num: '02', title: 'Select Time', desc: 'Pick your preferred date and time slot' },
  { icon: 'payments', num: '03', title: 'Pay Online', desc: 'Secure payment via Midtrans' },
  { icon: 'groups', num: '04', title: 'Play!', desc: 'Show up and enjoy your game' },
]

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

export default function LandingPage() {
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/courts')
      .then(r => r.json())
      .then(res => setCourts((res.data || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen">

        {/* ─── Hero ─── */}
        <section className="relative h-[92vh] min-h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80"
              alt="Padel court"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1B5E20]/90 via-[#1B5E20]/70 to-transparent" />
          </div>
          <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-10 w-full">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold tracking-wide mb-6 backdrop-blur-sm">
                #1 Padel Booking Platform
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
                Book Your
                <br />
                <span className="text-[#A5D6A7]">Padel Court</span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                Find and reserve the best padel courts in your area. Instant booking, secure payment, and flexible scheduling.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/courts"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#1B5E20] font-semibold text-sm hover:bg-[#A5D6A7] transition-colors shadow-xl"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  Browse Courts
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Get Started
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" className="w-full">
              <path d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H0Z" className="fill-surface" />
            </svg>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="py-20 md:py-28">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="text-center mb-16">
              <span className="text-[#1B5E20] text-sm font-semibold tracking-wide uppercase">Why Aero Padel</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mt-3">
                Everything You Need
              </h2>
              <p className="text-on-surface-variant mt-3 max-w-md mx-auto">
                From booking courts to finding coaches, we&apos;ve got your padel journey covered.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 hover:border-[#1B5E20]/30 hover:shadow-xl hover:shadow-[#1B5E20]/5 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1B5E20]/10 flex items-center justify-center mb-6 group-hover:bg-[#1B5E20] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px] text-[#1B5E20] group-hover:text-white transition-colors">
                      {f.icon}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-on-surface mb-3">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-20 md:py-28 bg-[#1B5E20]/5">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="text-center mb-16">
              <span className="text-[#1B5E20] text-sm font-semibold tracking-wide uppercase">Simple Process</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mt-3">
                How It Works
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((s, i) => (
                <div key={s.num} className="relative text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-[#1B5E20]/15" />
                  )}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-[#1B5E20] text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#1B5E20]/25">
                    <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1B5E20] tracking-widest mb-2 block">{s.num}</span>
                  <h3 className="text-lg font-display font-bold text-on-surface mb-2">{s.title}</h3>
                  <p className="text-on-surface-variant text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Popular Courts ─── */}
        <section className="py-20 md:py-28">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-[#1B5E20] text-sm font-semibold tracking-wide uppercase">Top Picks</span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mt-3">
                  Popular Courts
                </h2>
              </div>
              <Link
                href="/courts"
                className="hidden sm:inline-flex items-center gap-1.5 text-[#1B5E20] text-sm font-semibold hover:underline"
              >
                View All
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden animate-pulse">
                    <div className="h-48 bg-surface-container" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-surface-container rounded-full w-3/4" />
                      <div className="h-4 bg-surface-container rounded-full w-1/2" />
                      <div className="h-4 bg-surface-container rounded-full w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`/book/${court.id}`}
                    className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden hover:shadow-xl hover:shadow-[#1B5E20]/8 transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={court.image_url || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75'}
                        alt={court.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1B5E20] text-white text-xs font-semibold capitalize">
                        {court.type}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-on-surface mb-1 group-hover:text-[#1B5E20] transition-colors">
                        {court.name}
                      </h3>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-3">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {court.location || 'Jakarta'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#1B5E20] font-bold text-sm">
                          {formatPrice(court.price_per_hour)}
                          <span className="font-normal text-on-surface-variant">/hr</span>
                        </span>
                        <span className="text-xs font-semibold text-[#1B5E20] bg-[#1B5E20]/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          Book Now
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="sm:hidden text-center mt-8">
              <Link
                href="/courts"
                className="inline-flex items-center gap-1.5 text-[#1B5E20] text-sm font-semibold hover:underline"
              >
                View All Courts
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Membership CTA ─── */}
        <section className="py-20 md:py-28">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="relative rounded-[2rem] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1400&q=80"
                alt="Padel membership"
                className="w-full h-[400px] md:h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1B5E20]/95 via-[#1B5E20]/80 to-[#1B5E20]/50" />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-lg px-8 md:px-14">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4">
                    EXCLUSIVE
                  </span>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 leading-tight">
                    Join Our Membership
                  </h2>
                  <p className="text-white/80 mb-8 leading-relaxed">
                    Get priority booking, discounted rates, free coaching sessions, and exclusive tournament access.
                  </p>
                  <Link
                    href="/membership"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#1B5E20] font-semibold text-sm hover:bg-[#A5D6A7] transition-colors shadow-xl"
                  >
                    <span className="material-symbols-outlined text-[20px]">card_membership</span>
                    Explore Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
