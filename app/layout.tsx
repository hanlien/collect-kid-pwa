import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PWAProvider from '@/components/PWAProvider';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ed7516',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://buggies-with-brandon.vercel.app'),
  title: 'Backyard Brandon - Explore Nature with Your Camera',
  description: 'Explore your backyard and discover amazing creatures with Brandon! Learn fun facts and collect badges in this kid-friendly nature app.',
  keywords: 'nature, kids, education, camera, identification, flowers, bugs, animals, backyard',
  authors: [{ name: 'Backyard Brandon Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Backyard Brandon',
  },
  openGraph: {
    title: 'Backyard Brandon - Explore Nature',
    description: 'Explore your backyard and discover amazing creatures with Brandon!',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backyard Brandon - Explore Nature',
    description: 'Explore your backyard and discover amazing creatures with Brandon!',
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
        <meta name="apple-mobile-web-app-title" content="Backyard Brandon" />
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
