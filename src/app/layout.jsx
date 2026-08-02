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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
