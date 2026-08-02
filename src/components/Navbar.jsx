"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { label: 'Courts', href: '/courts' },
  { label: 'Coaches', href: '/coaches' },
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Shop', href: '/shop' },
  { label: 'Membership', href: '/membership' },
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/images/logopadel.png" alt="Aero Padel" width={48} height={48} className="rounded-xl object-cover shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300" priority />
          <span className="font-brand text-[32px] leading-none tracking-wider text-on-surface group-hover:text-primary transition-colors duration-300">AERO PADEL</span>
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Theme + Auth */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-bold hover:shadow-md transition-shadow"
              >
                {user.email?.charAt(0).toUpperCase()}
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-outline-variant/20">
                      <p className="text-sm font-medium text-on-surface truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        My Bookings
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        Profile
                      </Link>
                    </div>
                    <div className="border-t border-outline-variant/20 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/50 transition-colors w-full"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-t border-outline-variant/20 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-full text-sm font-medium text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
            {user && (
              <div className="pt-3 border-t border-outline-variant/20">
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container/50 transition-colors w-full"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
