import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { DebugPanel } from '@/components/DebugPanel';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'trippi',
  description: 'AI-powered trip planning - Plan your trip in minutes, not hours',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        <Toaster position="bottom-right" richColors />
        <DebugPanel />
      </body>
    </html>
  );
}
