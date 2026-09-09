'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SceneBlog() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-[#0D1B2A]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full px-[5vw] items-center h-full">
        <div className="w-1/2 pr-[5vw] z-10 relative">
          <motion.img 
            src="/ai-times-og.png" 
            className="w-full rounded-xl shadow-2xl"
            initial={{ y: 40, opacity: 0, rotateY: 20 }}
            animate={{ y: 0, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.img 
            src="/google_article_cover.jpg" 
            className="w-3/4 rounded-xl shadow-2xl absolute bottom-[15vh] left-[15vw]"
            initial={{ y: 60, opacity: 0, rotateY: 30 }}
            animate={phase >= 1 ? { y: 0, opacity: 1, rotateY: 0 } : { y: 60, opacity: 0, rotateY: 30 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="w-1/2">
          <motion.p 
            className="text-[#F47C20] font-bold tracking-widest uppercase text-[1vw] mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Thought Leadership
          </motion.p>
          <motion.h2 
            className="text-[5vw] font-syne font-bold leading-none mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            The AI Times
          </motion.h2>
          <motion.p 
            className="text-[1.5vw] text-[#3A4A5C] max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
          >
            Insights, strategies, and real-world applications of artificial intelligence for the modern enterprise.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
