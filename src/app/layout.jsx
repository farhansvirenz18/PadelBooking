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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
