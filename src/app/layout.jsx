import { Sora, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Aero Padel - Book Padel Courts Easily',
  description: 'Book padel courts, hire coaches, join tournaments, and shop for equipment.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${sora.variable} ${hanken.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
