"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Image from 'next/image';
import UserAvatar from './UserAvatar';
import { userFetch } from '@/lib/userFetch';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { icon: 'dashboard', label: 'Dashboard', href: '/admin' },
    ],
  },
  {
    title: 'Management',
    items: [
      { icon: 'sports_tennis', label: 'Courts', href: '/admin/courts' },
      { icon: 'calendar_month', label: 'Time Slots', href: '/admin/slots' },
      { icon: 'receipt_long', label: 'Bookings', href: '/admin/bookings' },
      { icon: 'school', label: 'Coaches', href: '/admin/coaches' },
      { icon: 'emoji_events', label: 'Tournaments', href: '/admin/tournaments' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { icon: 'store', label: 'Shop', href: '/admin/shop' },
      { icon: 'card_membership', label: 'Memberships', href: '/admin/memberships' },
      { icon: 'local_offer', label: 'Vouchers', href: '/admin/vouchers' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: 'group', label: 'Users', href: '/admin/users' },
      { icon: 'settings', label: 'Settings', href: '/admin/settings' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    userFetch('/api/users/profile').then(r => r.json()).then(res => {
      if (res.data) setProfile(res.data);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-outline-variant/30">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <Image src="/images/logopadel.png" alt="Aero Padel" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-on-surface">Aero Padel</h1>
            <p className="text-xs text-on-surface-variant">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest px-3 mb-2">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 px-3 mb-3">
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            size={32}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">
              {profile?.first_name || profile?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-on-surface-variant truncate">{profile?.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors mb-2"
        >
          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
          Lihat Website
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container transition-colors w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden bg-surface-container-lowest rounded-xl p-2 shadow-lg border border-outline-variant/30"
      >
        <span className="material-symbols-outlined text-on-surface">{mobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[55] bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-[56] h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/30 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <NavContent />
      </aside>
    </>
  );
}
