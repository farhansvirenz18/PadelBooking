"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { toast } from 'sonner'
import Footer from '@/components/Footer'
import { userFetch } from '@/lib/userFetch'

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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/shop/products?id=${params.id}`)
      .then(r => r.json())
      .then(res => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const handleAddToOrder = async () => {
    if (!product || product.stock <= 0) return
    setOrdering(true)
    try {
      const res = await userFetch('/api/shop/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          shippingAddress: '',
          notes: '',
        }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error(data.error || 'Order created! Check your email for payment details.')
      }
    } catch {
      toast.error('Failed to create order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
              <div className="aspect-square bg-surface-container rounded-3xl" />
              <div className="space-y-4">
                <div className="h-4 bg-surface-container rounded w-1/3" />
                <div className="h-8 bg-surface-container rounded w-2/3" />
                <div className="h-4 bg-surface-container rounded w-1/2" />
                <div className="h-20 bg-surface-container rounded" />
                <div className="h-10 bg-surface-container rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant">shopping_bag</span>
            <h2 className="text-xl font-display font-bold text-on-surface mt-4">Product not found</h2>
            <button
              onClick={() => router.push('/shop')}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors"
            >
              Browse Shop
            </button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const stockStatus = getStockStatus(product.stock)
  const hasDiscount = product.discount_price && product.discount_price < product.price
  const images = product.images?.length > 0 ? product.images : [product.image_url || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=75']

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
            <span className="text-sm font-medium">Back to Shop</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left: Images */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/15">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <span className="absolute top-4 left-4 px-4 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold">
                    SALE
                  </span>
                )}
                <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold ${STOCK_BADGES[stockStatus].color}`}>
                  {STOCK_BADGES[stockStatus].label}
                </span>
              </div>

              {/* Thumbnail gallery */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? 'border-[#1B5E20]' : 'border-outline-variant/20'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Brand */}
              {product.brand && (
                <span className="text-[#1B5E20] text-sm font-semibold uppercase tracking-wider">
                  {product.brand}
                </span>
              )}

              {/* Name */}
              <h1 className="text-3xl font-display font-bold text-on-surface">{product.name}</h1>

              {/* Category */}
              <span className="inline-block px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium capitalize">
                {product.category}
              </span>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-[#1B5E20] font-bold text-3xl">{formatPrice(product.discount_price)}</span>
                    <span className="text-on-surface-variant text-lg line-through">{formatPrice(product.price)}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-bold">
                      -{Math.round((1 - product.discount_price / product.price) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-[#1B5E20] font-bold text-3xl">{formatPrice(product.price)}</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                  <h2 className="font-display font-bold text-on-surface mb-2">Description</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Stock info */}
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">inventory_2</span>
                <span className="text-on-surface-variant">
                  {product.stock > 0 ? `${product.stock} units available` : 'Currently out of stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="text-on-surface font-bold text-lg w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              {product.stock > 0 && (
                <div className="p-4 rounded-xl bg-surface-container flex items-center justify-between">
                  <span className="text-on-surface-variant text-sm">Total</span>
                  <span className="text-[#1B5E20] font-bold text-xl">
                    {formatPrice((hasDiscount ? product.discount_price : product.price) * quantity)}
                  </span>
                </div>
              )}

              {/* Add to Order Button */}
              <button
                onClick={handleAddToOrder}
                disabled={ordering || product.stock <= 0}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ordering ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    Processing...
                  </>
                ) : product.stock <= 0 ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    Out of Stock
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    Add to Order
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
