import { useCallback, useRef, useEffect } from 'react';
import { UI_TIMINGS } from '../lib/ui/constants';

export function usePadRepeat(
  tryMove: (dr: number, dc: number) => void,
  autoRepeatEnabled?: boolean
) {
  const repeatRef = useRef<{ timeout?: number; interval?: number } | null>(null);

  // Store latest tryMove in ref to avoid recreating callbacks
  const tryMoveRef = useRef(tryMove);
  useEffect(() => {
    tryMoveRef.current = tryMove;
  });

  const clearRepeat = useCallback(() => {
    const r = repeatRef.current;
    if (!r) return;
    if (typeof r.timeout === 'number') {
      window.clearTimeout(r.timeout);
    }
    if (typeof r.interval === 'number') {
      window.clearInterval(r.interval);
    }
    repeatRef.current = null;
  }, []);

  const beginRepeat = useCallback((dr: number, dc: number) => {
    if (!autoRepeatEnabled) return;
    clearRepeat();

    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        tryMoveRef.current(dr, dc);
      }, UI_TIMINGS.PAD_REPEAT_INTERVAL);
      repeatRef.current = { interval };
    }, UI_TIMINGS.PAD_LONG_PRESS_DELAY);
    repeatRef.current = { timeout };
  }, [autoRepeatEnabled, clearRepeat]);

  useEffect(() => {
    return () => {
      clearRepeat();
    };
  }, [clearRepeat]);

  return { beginRepeat, clearRepeat };
}
