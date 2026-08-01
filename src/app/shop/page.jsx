"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const CATEGORIES = ['all', 'rackets', 'balls', 'shoes', 'apparel', 'accessories', 'bags']

const STOCK_BADGES = {
  in_stock: { label: 'In Stock', color: 'bg-[#1B5E20]/10 text-[#1B5E20]' },
  low_stock: { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-600' },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-500/10 text-red-600' },
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

function getStockStatus(stock) {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= 5) return 'low_stock'
  return 'in_stock'
}

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetch('/api/shop/products')
      .then(r => r.json())
      .then(res => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    return result
  }, [products, search, categoryFilter])

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20">

        {/* Header */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-2">
            Shop
          </h1>
          <p className="text-on-surface-variant">
            Premium padel gear and accessories. Equip yourself for the game.
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
                placeholder="Search by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                    categoryFilter === c
                      ? 'bg-[#1B5E20] text-white shadow-md shadow-[#1B5E20]/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mb-6">
          <p className="text-on-surface-variant text-sm">
            {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-surface-container" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-surface-container rounded-full w-1/3" />
                    <div className="h-5 bg-surface-container rounded-full w-3/4" />
                    <div className="h-4 bg-surface-container rounded-full w-1/2" />
                    <div className="h-10 bg-surface-container rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">shopping_bag</span>
              </div>
              <h3 className="text-xl font-display font-bold text-on-surface mb-2">No products found</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">
                Try adjusting your search or filters to find what you need.
              </p>
              <button
                onClick={() => { setSearch(''); setCategoryFilter('all') }}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => {
                const stockStatus = getStockStatus(product.stock)
                const hasDiscount = product.discount_price && product.discount_price < product.price
                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="group rounded-3xl bg-surface-container-lowest border border-outline-variant/15 overflow-hidden hover:shadow-xl hover:shadow-[#1B5E20]/8 transition-all duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-surface-container">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=75'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {hasDiscount && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                          SALE
                        </span>
                      )}
                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold ${STOCK_BADGES[stockStatus].color}`}>
                        {STOCK_BADGES[stockStatus].label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Brand */}
                      {product.brand && (
                        <span className="text-[#1B5E20] text-[11px] font-semibold uppercase tracking-wider mb-1">
                          {product.brand}
                        </span>
                      )}

                      <h3 className="font-display font-bold text-on-surface mb-1 group-hover:text-[#1B5E20] transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Category */}
                      <span className="text-on-surface-variant text-[11px] capitalize mb-3">{product.category}</span>

                      <div className="mt-auto">
                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          {hasDiscount ? (
                            <>
                              <span className="text-[#1B5E20] font-bold text-lg">{formatPrice(product.discount_price)}</span>
                              <span className="text-on-surface-variant text-xs line-through">{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span className="text-[#1B5E20] font-bold text-lg">{formatPrice(product.price)}</span>
                          )}
                        </div>

                        {/* View button */}
                        <div className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-[#1B5E20] text-[#1B5E20] text-sm font-semibold hover:bg-[#1B5E20] hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          View Details
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
