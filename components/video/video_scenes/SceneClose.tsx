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
        // Not logo.svg: it draws the wordmark with <text> in Helvetica Neue,
        // so on machines without that font the fallback overruns the viewBox
        // and the trailing S is clipped. This is the footer's transparent logo
        // cropped to its content — the original is a square canvas only a
        // quarter filled, which made a height-sized logo render tiny.
        src="/logo-on-dark.png"
        alt="TIBLOGICS"
        className="h-[10cqw] mb-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.h2 
        className="text-[3cqw] font-syne font-medium text-white/80"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        Real Business Impact.
      </motion.h2>
    </motion.div>
  );
}
