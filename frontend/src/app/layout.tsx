import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/theme-provider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'FinTrack - Gestor Financiero',
  description: 'Tu gestor inteligente de finanzas personales, gastos, ingresos y metas',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinTrack',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon-32x32.png?v=3', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png?v=3', type: 'image/png', sizes: '16x16' },
      { url: '/icon-192.png?v=3', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png?v=3', type: 'image/png', sizes: '512x512' },
      { url: '/icon.png?v=3', type: 'image/png', sizes: '512x512' },
      { url: '/logo.png?v=3', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=3', sizes: '180x180' },
      { url: '/icon-512.png?v=3', sizes: '512x512' },
      { url: '/icon.png?v=3', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico?v=3'],
  },
};

import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SettingsProvider>
              <AppShell>{children}</AppShell>
              <AuthModal />
              <Toaster position="bottom-right" richColors className="mb-16 md:mb-0" />
              <ServiceWorkerRegister />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
