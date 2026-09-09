'use client';
import { motion } from 'framer-motion';

export function SceneClose() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center text-white"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.img 
        src="/logo.svg" 
        alt="TIBLOGICS" 
        className="h-20 mb-10 brightness-0 invert"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.h2 
        className="text-[3vw] font-syne font-medium text-white/80"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        Real Business Impact.
      </motion.h2>
    </motion.div>
  );
}
