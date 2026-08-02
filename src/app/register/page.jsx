"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })
  }, [router])

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      if (data.user.identities?.length === 0) {
        setError('An account with this email already exists.')
        setLoading(false)
        return
      }
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
      });
      router.push('/login?registered=true')
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
                <span className="material-symbols-outlined text-white text-[28px]">person_add</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-on-surface">Create Account</h1>
              <p className="text-on-surface-variant text-sm mt-1">Join Aero Padel and start playing</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm font-medium border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">First Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Last name"
                  />
                </div>
              </div>

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
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Create a password"
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

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/30 transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant/40 text-[#1B5E20] focus:ring-[#1B5E20]/30"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  I agree to the{' '}
                  <Link href="#" className="text-[#1B5E20] font-medium hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="#" className="text-[#1B5E20] font-medium hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !email || !password || !firstName}
                className="w-full py-3 rounded-full bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#1B5E20]/90 transition-colors shadow-md shadow-[#1B5E20]/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Register'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-on-surface-variant mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1B5E20] font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
