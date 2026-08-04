"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { userFetch } from '@/lib/userFetch'
import { generateTicketPdf } from '@/lib/ticketPdf'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function shortId(uuid) {
  return uuid.replace(/-/g, '').substring(0, 8).toUpperCase()
}

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function BookingTicketPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef(null)

  useEffect(() => {
    userFetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setBooking(res.data)
          const qrContent = `AEROPADEL-BOOKING:${res.data.id}`
          QRCode.toDataURL(qrContent, {
            width: 200,
            margin: 2,
            color: { dark: '#1A1C1E', light: '#FFFFFF' },
          }).then(url => setQrDataUrl(url))
        } else {
          toast.error('Booking not found')
          router.push('/dashboard/bookings')
        }
      })
      .catch(() => {
        toast.error('Failed to load booking')
        router.push('/dashboard/bookings')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleDownloadPdf() {
    if (!booking || !qrDataUrl) return
    setDownloading(true)
    try {
      const doc = await generateTicketPdf(booking, qrDataUrl)
      doc.save(`AeroPadel-Ticket-${shortId(booking.id)}.pdf`)
      toast.success('Ticket downloaded!')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Failed to download ticket')
    }
    setDownloading(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[520px] mx-auto px-4">
            <div className="h-96 bg-surface-container rounded-3xl animate-pulse" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!booking) return null

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[520px] mx-auto px-4">

          {/* Back link */}
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            My Bookings
          </Link>

          {/* Ticket Card */}
          <div ref={ticketRef} className="rounded-3xl overflow-hidden bg-surface-container-lowest border border-outline-variant/15 shadow-lg">

            {/* Header */}
            <div className="bg-[#1B5E20] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold text-white">AERO PADEL</h1>
                  <p className="text-[#C8E6C9] text-xs mt-0.5">Booking Confirmation Ticket</p>
                </div>
                <div className="bg-[#C8E6C9] rounded-xl px-3 py-1.5 text-center">
                  <p className="text-[8px] text-[#1B5E20] font-medium uppercase">Booking Ref</p>
                  <p className="text-sm font-bold text-[#1B5E20] font-mono">{shortId(booking.id)}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="px-6 py-8 flex flex-col items-center">
              {qrDataUrl ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/10">
                  <img src={qrDataUrl} alt="Booking QR Code" className="w-40 h-40" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-surface-container rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant animate-spin">refresh</span>
                </div>
              )}
              <p className="text-xs text-on-surface-variant mt-3 text-center">Scan QR code at venue for check-in</p>
            </div>

            {/* Dashed divider */}
            <div className="px-6">
              <div className="border-t border-dashed border-outline-variant/40" />
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">
              {/* Court */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[18px]">sports_tennis</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Court</p>
                  <p className="text-sm font-semibold text-on-surface">{booking.courts?.name || 'Court'} <span className="font-normal text-on-surface-variant">({booking.courts?.type})</span></p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[18px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Date</p>
                  <p className="text-sm font-semibold text-on-surface">{formatDate(booking.time_slots?.date || booking.booking_date)}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[18px]">schedule</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Time</p>
                  <p className="text-sm font-semibold text-on-surface">{booking.time_slots?.start_time || booking.start_time} - {booking.time_slots?.end_time || booking.end_time}</p>
                </div>
              </div>

              {/* Coach (if any) */}
              {booking.coaches?.name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[#1B5E20] text-[18px]">sports</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Coach</p>
                    <p className="text-sm font-semibold text-on-surface">{booking.coaches.name}</p>
                  </div>
                </div>
              )}

              {/* Duration */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[18px]">timer</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Duration</p>
                  <p className="text-sm font-semibold text-on-surface">{booking.duration_hours || 1} hour(s)</p>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="border-t border-dashed border-outline-variant/40" />

              {/* Price & Status row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant">Total Price</p>
                  <p className="text-lg font-bold text-on-surface">{formatPrice(booking.total_price)}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                  {booking.payment_status === 'paid' ? 'Paid' : booking.status}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-surface-container px-6 py-3 text-center">
              <p className="text-[10px] text-on-surface-variant">Show this ticket at the venue entrance</p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || !qrDataUrl}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#2E7D32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#1B5E20]/20"
          >
            <span className="material-symbols-outlined text-[20px]">
              {downloading ? 'refresh' : 'download'}
            </span>
            {downloading ? 'Generating PDF...' : 'Download Ticket (PDF)'}
          </button>

          {/* Tip */}
          <p className="text-center text-xs text-on-surface-variant mt-3">
            Screenshot or download this ticket to show at the venue.
          </p>

        </div>
      </main>
      <Footer />
    </>
  )
}
