'use client';

import { WalletConnectButton } from '../components/wallet-connect-button';
import { useEffect, useState } from 'react';
import { getStoredUserScore } from '../lib/score-store';
import { ReputationOrb } from '../components/reputation-orb';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  const [userScore, setUserScore] = useState(84);

  useEffect(() => {
    setUserScore(getStoredUserScore());
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16 text-white">
      <section className="grid w-full gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
              Live on Polygon Mumbai
            </p>
          </div>
          
          <h1 className="max-w-4xl text-6xl font-bold leading-[1.1] tracking-tight md:text-8xl">
            The Future of Work is On-Chain.
          </h1>
          
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Verified skills, protected payments, and immutable reputation. 
            TrustWork X eliminates the uncertainty of freelancing with AI-driven 
            verification and decentralized escrow.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <WalletConnectButton />
            <Link 
              href="/jobs"
              className="group relative rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
            >
              Browse Jobs
              <span className="absolute -bottom-px left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all group-hover:w-1/2"></span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5 max-w-xl">
            <div>
              <p className="text-3xl font-bold text-white">2.5k+</p>
              <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Verified Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Dispute Resolution</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">0.3s</p>
              <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Settlement Time</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex flex-col items-center justify-center"
        >
          {/* Main Visual Element */}
          <ReputationOrb score={userScore} />
          
          {/* Floating Feature Cards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-1/4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">🔒</div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Escrow</p>
                <p className="text-xs font-semibold text-slate-200">Funds Protected</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-4 bottom-1/4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">⚡</div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">AI Grading</p>
                <p className="text-xs font-semibold text-slate-200">Instant Verification</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
