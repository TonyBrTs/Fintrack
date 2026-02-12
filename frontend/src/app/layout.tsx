import { Header } from '@/components/layout/Header';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { ThemeProvider } from '@/components/theme-provider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'FinTrack',
  description: 'Your intelligent financial tracker',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <div className="sticky top-0 z-50">
              <Header />
              <div className="md:h-0.5 bg-gray-300 w-full h-0.5" />
              <SubNavbar />
              <div className="md:h-0.5 bg-gray-300 w-full md:hidden" />
            </div>
            <main className="w-full max-w-360 mx-auto px-4 md:px-10 lg:px-20 pb-24 md:pb-0">
              {children}
            </main>
            <Toaster position="bottom-right" richColors />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
