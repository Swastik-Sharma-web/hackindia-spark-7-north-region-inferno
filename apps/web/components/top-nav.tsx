'use client';

import Link from 'next/link';
import { GoogleSignInButton } from './google-sign-in';

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm text-slate-300">
        <Link href="/" className="font-semibold tracking-[0.2em] text-white uppercase">
          TrustWork X
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/challenge">Challenge</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/escrow">Escrow</Link>
          <Link href="/profile">Profile</Link>
          <div className="ml-2 border-l border-white/10 pl-4">
            <GoogleSignInButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
