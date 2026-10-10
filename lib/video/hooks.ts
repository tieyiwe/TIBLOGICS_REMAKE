import { useState, useEffect } from 'react';

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  
  useEffect(() => {
    const durationValues = Object.values(durations);
    if (durationValues.length === 0) return;

    let timeout: NodeJS.Timeout;
    let isFirstPass = true;

    if (typeof window !== 'undefined' && (window as any).startRecording) {
      (window as any).startRecording();
    }

    const playScene = (index: number) => {
      setCurrentScene(index);
      const duration = durationValues[index];
      
      timeout = setTimeout(() => {
        const nextScene = index + 1;
        if (nextScene >= durationValues.length) {
          if (isFirstPass && typeof window !== 'undefined' && (window as any).stopRecording) {
            (window as any).stopRecording();
            isFirstPass = false;
          }
          playScene(0);
        } else {
          playScene(nextScene);
        }
      }, duration);
    };

    playScene(0);

    return () => clearTimeout(timeout);
  }, [JSON.stringify(durations)]);

  return { currentScene };
}
