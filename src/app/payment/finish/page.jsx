"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function FinishContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')
  const [verifying, setVerifying] = useState(true)
  const [verifiedStatus, setVerifiedStatus] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setVerifying(false)
      return
    }
    // Verify & sync payment status with Midtrans
    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setVerifiedStatus(res.payment_status)
        }
      })
      .catch(() => {})
      .finally(() => setVerifying(false))
  }, [orderId])

  const effectiveStatus = verifiedStatus || (transactionStatus === 'settlement' || transactionStatus === 'capture' ? 'paid' : transactionStatus === 'pending' ? 'unpaid' : 'failed')
  const isSuccess = effectiveStatus === 'paid'
  const isPending = effectiveStatus === 'unpaid' && transactionStatus === 'pending'
  const isFailed = !isSuccess && !isPending

  function getBackLink() {
    if (!orderId) return '/dashboard/bookings'
    if (orderId.startsWith('SO')) return '/dashboard/orders'
    if (orderId.startsWith('CB')) return '/dashboard/bookings'
    if (orderId.startsWith('TR')) return '/dashboard/bookings'
    if (orderId.startsWith('MB')) return '/dashboard/profile'
    return '/dashboard/bookings'
  }

  function getBackLabel() {
    if (!orderId) return 'View My Bookings'
    if (orderId.startsWith('SO')) return 'View My Orders'
    if (orderId.startsWith('MB')) return 'View My Profile'
    return 'View My Bookings'
  }

  if (verifying) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto px-4 text-center">
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 shadow-xl">
              <span className="w-10 h-10 border-3 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin inline-block mb-4" />
              <h1 className="text-xl font-display font-bold text-on-surface mb-2">Verifying Payment...</h1>
              <p className="text-on-surface-variant text-sm">Please wait while we confirm your payment status.</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 shadow-xl text-center">

            {isSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#1B5E20]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#1B5E20] text-[36px]">check_circle</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">Payment Successful!</h1>
                <p className="text-on-surface-variant text-sm mb-6">Thank you for your payment. Your booking has been confirmed.</p>
              </>
            ) : isPending ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-amber-500 text-[36px]">hourglass_top</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">Payment Pending</h1>
                <p className="text-on-surface-variant text-sm mb-6">Your payment is being processed. Please wait a moment.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-red-500 text-[36px]">cancel</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">Payment Failed</h1>
                <p className="text-on-surface-variant text-sm mb-6">
                  Your payment was not completed. You can try again from your dashboard.
                </p>
              </>
            )}

            {orderId && (
              <div className="bg-surface-container rounded-2xl p-4 mb-6">
                <p className="text-xs text-on-surface-variant mb-1">Order ID</p>
                <p className="text-sm font-mono font-medium text-on-surface">{orderId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href={getBackLink()}
                className="w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                {getBackLabel()}
              </Link>
              <Link
                href="/"
                className="w-full py-3 rounded-full border border-outline-variant/40 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function PaymentFinishPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin" />
      </div>
    }>
      <FinishContent />
    </Suspense>
  )
}
