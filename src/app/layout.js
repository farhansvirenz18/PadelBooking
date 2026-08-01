import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata = {
  title: "NexusPay",
  description: "Platform top-up game cepat, aman, dan terpercaya.",
  icons: {
    icon: [
      { url: "/images/logonexus.png", type: "image/png" },
    ],
    apple: "/images/logonexus.png",
    shortcut: "/images/logonexus.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Sora:wght@600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen flex flex-col antialiased relative" suppressHydrationWarning>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
