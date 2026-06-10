'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SceneTools() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center text-white"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center w-full max-w-[80vw]">
        <motion.div 
          className="relative inline-block mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <img src="/tibo-avatar.svg" alt="Tibo AI" className="w-[12vw] h-[12vw] rounded-full object-cover border-4 border-[#F47C20] bg-[#162B52]" />
          <motion.div 
            className="absolute -bottom-4 -right-4 bg-[#F47C20] text-white px-4 py-1 text-[1vw] font-bold rounded-full"
            initial={{ scale: 0 }}
            animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Tibo AI Agent
          </motion.div>
        </motion.div>

        <motion.h2 
          className="text-[4.5vw] font-syne font-bold leading-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Smart Tools. Custom Models.
        </motion.h2>
        
        <motion.div
          className="mt-12 flex justify-center gap-8"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src="/tb_cover.png" className="w-[30vw] rounded-xl shadow-2xl" />
        </motion.div>
      </div>
    </motion.div>
  );
}
