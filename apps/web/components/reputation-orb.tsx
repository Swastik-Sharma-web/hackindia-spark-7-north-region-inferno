'use client';

import { motion } from 'framer-motion';

interface ReputationOrbProps {
  score: number;
}

export function ReputationOrb({ score }: ReputationOrbProps) {
  // Normalize score for visual effects
  const normalizedScore = Math.max(0, Math.min(100, score));
  const intensity = normalizedScore / 100;

  return (
    <div className="relative flex items-center justify-center h-48 w-48 md:h-64 md:w-64">
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 blur-3xl"
      />

      {/* Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-white/20 p-1"
      >
        <div className="h-full w-full rounded-full border border-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]" />
      </motion.div>

      {/* The Core Orb */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative h-32 w-32 md:h-40 md:w-40 rounded-full bg-slate-950 border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center"
      >
        {/* Animated Fluid/Gradient inside */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-[-50%] bg-gradient-to-t from-cyan-500/40 via-violet-500/20 to-transparent"
          style={{
            bottom: `${intensity * 100}%`
          }}
        />

        {/* Score Text */}
        <div className="relative z-10 text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.3em] text-slate-400"
          >
            Reputation
          </motion.p>
          <motion.h2 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent"
          >
            {normalizedScore}
          </motion.h2>
        </div>

        {/* Reflection Highlight */}
        <div className="absolute top-2 left-4 h-12 w-12 rounded-full bg-white/10 blur-xl" />
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute -bottom-2 right-0 md:right-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 px-3 py-1 rounded-full shadow-lg"
      >
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">
          Verified Status
        </p>
      </motion.div>
    </div>
  );
}
