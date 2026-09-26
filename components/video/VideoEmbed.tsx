'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { SceneOpen } from './video_scenes/SceneOpen';
import { SceneServices } from './video_scenes/SceneServices';
import { SceneBlog } from './video_scenes/SceneBlog';
import { SceneTools } from './video_scenes/SceneTools';
import { SceneArfa } from './video_scenes/SceneArfa';
import { SceneClose } from './video_scenes/SceneClose';

const SCENE_DURATIONS = {
  open: 5000,
  services: 6500,
  blog: 6000,
  tools: 5500,
  arfa: 5000,
  close: 4000,
};

const bgColors = [
  '#0D1B2A',
  '#1B3A6B',
  '#F4F7FB',
  '#1B3A6B',
  '#F47C20',
  '#0D1B2A',
];

export default function VideoEmbed() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    // containerType makes the scenes' cqw units resolve against THIS box.
    // They used vw before, which is the viewport — but this frame is only as
    // wide as its column (~830px inside max-w-4xl), so on a wide screen the
    // type came out roughly 50% too large: headings broke mid-word and cards
    // ran off the right edge.
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#0D1B2A] font-dm selection:bg-[#F47C20]/30"
      style={{ aspectRatio: '16/9', containerType: 'inline-size' }}>
      {/* Persistent Background Layer */}
      <motion.div
        className="absolute inset-0 transition-colors duration-1000"
        animate={{ backgroundColor: bgColors[currentScene] }}
      />

      {/* Persistent Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("/noise.png")' }} />

      {/* Persistent Accent Elements */}
      <motion.div
        className="absolute rounded-full blur-[100px] pointer-events-none"
        animate={{
          background: currentScene === 2 ? 'radial-gradient(circle, #D2DCE8, transparent)' : 'radial-gradient(circle, #F47C20, transparent)',
          width: currentScene === 4 ? '100%' : '50%',
          height: currentScene === 4 ? '100%' : '50%',
          x: ['-20%', '60%', '20%', '-10%', '50%', '10%'][currentScene],
          y: ['-20%', '-10%', '60%', '50%', '-20%', '30%'][currentScene],
          opacity: [0.15, 0.2, 0.5, 0.15, 0.3, 0.15][currentScene],
        }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Persistent Graphic Lines */}
      <motion.div
        className="absolute h-[1px] bg-current opacity-10 pointer-events-none"
        animate={{
          left: ['0%', '10%', '0%', '20%', '0%', '50%'][currentScene],
          width: ['100%', '80%', '100%', '60%', '100%', '0%'][currentScene],
          top: ['50%', '80%', '20%', '60%', '40%', '50%'][currentScene],
          color: currentScene === 2 ? '#1B3A6B' : '#FFFFFF',
        }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* "wait", not "popLayout": popLayout mounts the incoming scene while the
          outgoing one is still exiting, so at the loop point SceneClose and
          SceneOpen both drew the logo at once — two offset wordmarks. Waiting
          for the exit costs about a second of scene time and shows one at a time. */}
      <AnimatePresence mode="wait">
        {currentScene === 0 && <SceneOpen key="open" />}
        {currentScene === 1 && <SceneServices key="services" />}
        {currentScene === 2 && <SceneBlog key="blog" />}
        {currentScene === 3 && <SceneTools key="tools" />}
        {currentScene === 4 && <SceneArfa key="arfa" />}
        {currentScene === 5 && <SceneClose key="close" />}
      </AnimatePresence>
    </div>
  );
}
