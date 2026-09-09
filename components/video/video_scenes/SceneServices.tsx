'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const services = [
  "AI Consulting",
  "Workflow Automation",
  "AI Agents",
  "Web & Mobile Dev"
];

export function SceneServices() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center px-[10vw]"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-1/2 pr-10">
        <motion.p className="text-[#F47C20] font-bold tracking-widest uppercase text-[1vw] mb-4">
          Core Capabilities
        </motion.p>
        <motion.h2 className="text-[4vw] font-syne font-bold text-white leading-[1.1]">
          Intelligent Infrastructure.
        </motion.h2>
      </div>

      <div className="w-1/2 flex flex-col gap-4 border-l border-white/20 pl-10 py-10">
        {services.map((service, i) => (
          <motion.div 
            key={service}
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={phase >= i + 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#F47C20]" />
            <h3 className="text-[2.5vw] font-dm text-white/90">{service}</h3>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
