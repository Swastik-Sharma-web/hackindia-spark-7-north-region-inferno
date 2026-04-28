import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { TopNav } from '../components/top-nav';
import { PageTransition } from '../components/page-transition';
import { BackgroundGlow } from '../components/background-glow';

export const metadata: Metadata = {
  title: 'TrustWork X',
  description: 'AI-powered decentralized reputation graph for the freelance economy.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppProviders>
          <BackgroundGlow />
          <TopNav />
          <PageTransition>
            {children}
          </PageTransition>
        </AppProviders>
      </body>
    </html>
  );
}
