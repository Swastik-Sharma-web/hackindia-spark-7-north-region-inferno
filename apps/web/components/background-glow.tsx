'use client';

import { motion } from 'framer-motion';

export function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Top Left Glow */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"
      />
      
      {/* Bottom Right Glow */}
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute -right-24 -bottom-24 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px]"
      />

      {/* Center mesh noise/texture if wanted, but keep it clean */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
    </div>
  );
}
