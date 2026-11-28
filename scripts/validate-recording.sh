#!/bin/bash
# Validate recording lifecycle in video components
set -e

echo "Checking video recording lifecycle..."

# Check useVideoPlayer hook exists and has startRecording/stopRecording
if ! grep -q "startRecording" lib/video/hooks.ts; then
  echo "FAIL: startRecording not found in lib/video/hooks.ts"
  exit 1
fi

if ! grep -q "stopRecording" lib/video/hooks.ts; then
  echo "FAIL: stopRecording not found in lib/video/hooks.ts"
  exit 1
fi

# Check VideoTemplate uses useVideoPlayer
if ! grep -q "useVideoPlayer" components/video/VideoTemplate.tsx; then
  echo "FAIL: useVideoPlayer not used in VideoTemplate.tsx"
  exit 1
fi

# Check AnimatePresence is present
if ! grep -q "AnimatePresence" components/video/VideoTemplate.tsx; then
  echo "FAIL: AnimatePresence not found in VideoTemplate.tsx"
  exit 1
fi

# Check each scene has initial/animate/exit
for scene in components/video/video_scenes/*.tsx; do
  if ! grep -q "initial=" "$scene"; then
    echo "FAIL: $scene missing initial prop"
    exit 1
  fi
  if ! grep -q "animate=" "$scene"; then
    echo "FAIL: $scene missing animate prop"
    exit 1
  fi
  if ! grep -q "exit=" "$scene"; then
    echo "WARN: $scene missing exit prop (may break loop)"
  fi
done

echo "PASS: Video recording lifecycle validation complete"
