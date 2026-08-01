"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  paid: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Paid' },
  processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing' },
  shipped: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Shipped' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      fetch('/api/shop/orders')
        .then(r => r.json())
        .then(res => setOrders(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [router])

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface">My Orders</h1>
            <p className="text-on-surface-variant mt-2">Track your shop orders and purchases.</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-surface-container rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">shopping_bag</span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">No orders yet</h3>
              <p className="text-on-surface-variant text-sm max-w-sm mb-6">
                You haven&apos;t placed any orders. Browse our shop to get started.
              </p>
              <Link
                href="/shop"
                className="px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header - Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-2">Order ID</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Items</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Details</div>
              </div>

              {orders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const items = order.shop_order_items || []
                const isExpanded = expandedId === order.id

                return (
                  <div key={order.id} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden">
                    {/* Order Row */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full text-left p-5 hover:bg-surface-container/50 transition-colors"
                    >
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2">
                          <span className="text-sm font-mono text-on-surface font-medium">
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-on-surface-variant">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-on-surface-variant">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm font-semibold text-on-surface">{formatPrice(order.total_amount)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono text-on-surface font-medium">#{order.id.slice(0, 8)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-on-surface-variant">{formatDate(order.created_at)}</span>
                          <span className="text-sm font-semibold text-on-surface">{formatPrice(order.total_amount)}</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-outline-variant/10">
                        <div className="pt-4 space-y-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-container">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                                {item.shop_products?.image_url ? (
                                  <img
                                    src={item.shop_products.image_url}
                                    alt={item.shop_products.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">inventory_2</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-on-surface truncate">
                                  {item.shop_products?.name || 'Product'}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  Qty: {item.quantity} &middot; {formatPrice(item.price)}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-on-surface">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}

                          {order.shipping_address && (
                            <div className="mt-4 p-3 rounded-2xl bg-surface-container">
                              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Shipping Address</p>
                              <p className="text-sm text-on-surface">{order.shipping_address}</p>
                            </div>
                          )}

                          {order.notes && (
                            <div className="p-3 rounded-2xl bg-surface-container">
                              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Notes</p>
                              <p className="text-sm text-on-surface">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
