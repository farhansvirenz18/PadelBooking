import Link from 'next/link';
import BrandLogo from './BrandLogo';

const QUICK_LINKS = [
  { label: 'Book a Court', href: '/courts' },
  { label: 'Find a Coach', href: '/coaches' },
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Shop', href: '/shop' },
  { label: 'Membership', href: '/membership' },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'FAQs', href: '#' },
  { label: 'Cancellation Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Privacy Policy', href: '#' },
];

const CONTACT_INFO = [
  { icon: 'location_on', text: 'Jl. Padel No. 123, Jakarta' },
  { icon: 'call', text: '+62 812-3456-7890' },
  { icon: 'mail', text: 'hello@padelbook.id' },
];

const SOCIALS = [
  { icon: 'Instagram', href: '#', path: 'M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm4.25 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.25-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  { icon: 'Facebook', href: '#', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z' },
  { icon: 'YouTube', href: '#', path: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43ZM9.75 15.02V8.48l5.75 3.27-5.75 3.27Z' },
  { icon: 'TikTok', href: '#', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.22V9.4a8.16 8.16 0 0 0 3.84.96V6.69Z' },
];

export default function Footer() {
  return (
    <footer className="bg-[#1B5E20] text-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[22px]">sports_tennis</span>
              </div>
              <span className="font-brand text-2xl tracking-wide">AERO PADEL</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Your all-in-one platform to book padel courts, hire coaches, join tournaments, and gear up.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={s.icon}
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-5">Support</h3>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-white/70 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-5">Contact</h3>
            <ul className="space-y-4">
              {CONTACT_INFO.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-white/60 text-[18px] mt-0.5">{item.icon}</span>
                  <span className="text-white/70 text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} Aero Padel. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-white/50 text-xs">
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
