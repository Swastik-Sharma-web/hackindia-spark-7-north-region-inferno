'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredScoreHistory, getStoredUserScore } from '@/lib/score-store';

export default function ProfilePage() {
  const [userScore, setUserScore] = useState(84);
  const [recentAttempts, setRecentAttempts] = useState<Array<{ score: number; skill: string; at: string }>>([]);

  useEffect(() => {
    setUserScore(getStoredUserScore());
    setRecentAttempts(getStoredScoreHistory());
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Reputation Passport</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Freelancer Profile</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">
          Back Home
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-600/25 via-slate-950 to-cyan-500/10 p-6 shadow-2xl shadow-violet-950/40">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-200">Passport NFT</p>
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl">
            <p className="text-sm text-slate-300">Wallet</p>
            <p className="mt-2 font-mono text-sm text-cyan-200">0xA1B2...9F42</p>
            <p className="mt-6 text-sm text-slate-300">Skill score</p>
            <p className="mt-2 text-5xl font-semibold text-white">{userScore}</p>
            <p className="mt-4 text-sm text-slate-300">Primary skill</p>
            <p className="mt-2 text-lg font-medium text-violet-200">React Developer</p>
          </div>
        </aside>

        <article className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">On-chain reputation summary</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Jobs</p>
              <p className="mt-3 text-3xl font-semibold">47</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Earnings</p>
              <p className="mt-3 text-3xl font-semibold">12.4 MATIC</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Passport</p>
              <p className="mt-3 text-3xl font-semibold">Minted</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
            <p className="text-sm text-slate-300">IPFS history CID</p>
            <p className="mt-2 font-mono text-sm text-cyan-200">bafybeigdyr6x...trustwork</p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Test Scores</p>
            <div className="mt-3 space-y-3">
              {recentAttempts.length ? recentAttempts.map((attempt, index) => (
                <div key={`${attempt.skill}-${attempt.at}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{attempt.skill}</p>
                    <p className="text-xs text-slate-400">{new Date(attempt.at).toLocaleString()}</p>
                  </div>
                  <p className="text-lg font-semibold text-emerald-400">{attempt.score}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No test attempts yet.</p>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
