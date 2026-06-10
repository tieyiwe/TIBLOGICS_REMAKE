'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SceneOpen() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src="/logo.svg" alt="TIBLOGICS" className="h-16 mx-auto mb-8 brightness-0 invert" />
        </motion.div>
        
        <div className="overflow-hidden">
          <motion.h1 
            className="text-[5vw] font-syne font-bold text-white tracking-tight leading-none uppercase"
            initial={{ y: '100%' }}
            animate={phase >= 1 ? { y: '0%' } : { y: '100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            AI Implementation
          </motion.h1>
        </div>
        <div className="overflow-hidden mt-2">
          <motion.h1 
            className="text-[4vw] font-syne font-medium text-white/70 tracking-tight leading-none uppercase"
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            & Digital Solutions
          </motion.h1>
        </div>
      </div>
    </motion.div>
  );
}
