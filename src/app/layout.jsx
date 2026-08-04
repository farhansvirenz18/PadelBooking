import { Bebas_Neue, Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const bebas = Bebas_Neue({ subsets: ['latin'], variable: '--font-brand', weight: '400', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'Aero Padel - Book Padel Courts Easily',
  description: 'Book padel courts, hire coaches, join tournaments, and shop for equipment.',
  icons: {
    icon: '/images/logopadel.png',
    apple: '/images/logopadel.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${bebas.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
        <script
          src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton className="z-[999]!" />
      </body>
    </html>
  );
}
