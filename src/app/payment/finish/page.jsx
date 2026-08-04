"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function FinishContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')

  const isSuccess = transactionStatus === 'settlement' || transactionStatus === 'capture'
  const isPending = transactionStatus === 'pending'
  const isFailed = transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel'

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
                  {isFailed ? 'Your payment was not completed. You can try again.' : 'Something went wrong with your payment.'}
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
                href="/dashboard/bookings"
                className="w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                View My Bookings
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
