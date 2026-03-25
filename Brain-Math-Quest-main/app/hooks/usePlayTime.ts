import { useState, useEffect } from 'react';

/**
 * usePlayTime Hook
 *
 * Manages play time tracking with automatic increment every second.
 *
 * @returns Object containing:
 *   - playTime: Current play time in seconds
 *   - setPlayTime: Setter to manually update play time (e.g., when loading a save)
 *
 * @example
 * ```tsx
 * const { playTime, setPlayTime } = usePlayTime();
 *
 * // Display play time
 * <div>Play Time: {formatTime(playTime)}</div>
 *
 * // Load from save
 * setPlayTime(savedPlayTime);
 * ```
 */
export function usePlayTime() {
  const [playTime, setPlayTime] = useState(0);

  // Auto-increment play time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { playTime, setPlayTime };
}
