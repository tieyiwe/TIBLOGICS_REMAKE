'use client';
import { motion } from 'framer-motion';

export function SceneArfa() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#F47C20] text-white overflow-hidden"
      initial={{ y: '100%' }}
      animate={{ y: '0%' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img 
        src="/arfa-banner.png" 
        className="w-[60vw] rounded-2xl shadow-2xl z-10"
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
      
      <motion.h2 
        className="text-[6vw] font-syne font-bold absolute bottom-[-5%] text-white/20 whitespace-nowrap z-0 pointer-events-none"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        AI READINESS FOR ALL • AI READINESS FOR ALL • 
      </motion.h2>
    </motion.div>
  );
}
