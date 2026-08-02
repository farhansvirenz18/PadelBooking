"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })
  }, [router])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const role = data.user.user_metadata?.role
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">

          {/* Card */}
          <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 shadow-xl">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#1B5E20] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white text-[28px]">sports_tennis</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-on-surface">Welcome Back</h1>
              <p className="text-on-surface-variant text-sm mt-1">Sign in to your Aero Padel account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[#1B5E20] text-sm font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-outline-variant/30" />
              <span className="text-on-surface-variant text-xs">OR</span>
              <div className="flex-1 h-px bg-outline-variant/30" />
            </div>

            {/* Social Login Placeholder */}
            <button
              type="button"
              className="w-full py-3 rounded-full border border-outline-variant/40 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-on-surface-variant mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#1B5E20] font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
