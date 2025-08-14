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
  title: 'Buggies with Brandon - Explore Nature with Your Camera',
  description: 'Explore your backyard and discover amazing creatures with Brandon! Learn fun facts and collect badges in this kid-friendly nature app.',
  keywords: 'nature, kids, education, camera, identification, flowers, bugs, animals, backyard',
  authors: [{ name: 'Buggies with Brandon Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Buggies with Brandon',
  },
  openGraph: {
    title: 'Buggies with Brandon - Explore Nature',
    description: 'Explore your backyard and discover amazing creatures with Brandon!',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buggies with Brandon - Explore Nature',
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
        {/* Preload critical resources */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" type="image/png" />
        <link rel="preconnect" href="https://api.inaturalist.org" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="//api.gbif.org" />
        
        {/* Icons and PWA */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        
        {/* PWA Meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Buggies with Brandon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Buggies with Brandon" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
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
