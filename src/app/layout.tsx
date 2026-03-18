import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SafeCheck — Food Safety Compliance for Restaurants',
    template: '%s | SafeCheck',
  },
  description: 'Digital food safety checklists for small restaurants. Pass health inspections without the panic.',
  keywords: ['food safety', 'restaurant compliance', 'health inspection', 'HACCP', 'temperature logging'],
  openGraph: {
    title: 'SafeCheck — Food Safety Compliance',
    description: 'Pass health inspections without the panic. Digital checklists for $19/mo.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10B981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
