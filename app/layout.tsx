import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWAProvider from '@/components/PWAProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collect Kid - Discover Nature with Your Camera',
  description: 'Identify flowers, bugs, and animals with your camera! Learn fun facts and collect badges in this kid-friendly nature app.',
  keywords: 'nature, kids, education, camera, identification, flowers, bugs, animals',
  authors: [{ name: 'Collect Kid Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#ed7516',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Collect Kid',
  },
  openGraph: {
    title: 'Collect Kid - Discover Nature',
    description: 'Identify flowers, bugs, and animals with your camera!',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Collect Kid - Discover Nature',
    description: 'Identify flowers, bugs, and animals with your camera!',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Collect Kid" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#ed7516" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </PWAProvider>
      </body>
    </html>
  );
}
