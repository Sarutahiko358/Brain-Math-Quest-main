import { useState, useMemo, useCallback } from 'react';
import { GameMode } from '../../lib/gameTypes';
import { DexData } from '../types';
import { createSeenUpdater, createDefeatedUpdater } from '../utils';

/**
 * Custom hook for managing monster bestiary data
 *
 * Consolidates dexStory and dexEndless management into a single hook
 * Provides mode-aware helpers for updating dex data
 *
 * Benefits:
 * - Reduces DQBrain.tsx complexity
 * - Centralizes dex management logic
 * - Provides clean API for dex operations
 */
export function useDexManagement(gameMode: GameMode) {
  const [dexStory, setDexStory] = useState<DexData>({});
  const [dexEndless, setDexEndless] = useState<DexData>({});

  // Current mode's dex (memoized for stable reference)
  const currentDex = useMemo(
    () => (gameMode === 'story' ? dexStory : dexEndless),
    [gameMode, dexStory, dexEndless]
  );

  // Update current mode's dex
  const updateDex = useCallback(
    (fn: (d: DexData) => DexData) => {
      if (gameMode === 'story') {
        setDexStory(fn);
      } else {
        setDexEndless(fn);
      }
    },
    [gameMode]
  );

  // Record that a monster was seen
  const recordSeen = useCallback(
    (name: string) => {
      updateDex(createSeenUpdater(name));
    },
    [updateDex]
  );

  // Record that a monster was defeated
  const recordDefeated = useCallback(
    (name: string) => {
      updateDex(createDefeatedUpdater(name));
    },
    [updateDex]
  );

  return {
    // State
    dexStory,
    dexEndless,
    currentDex,

    // Setters (for save/load operations)
    setDexStory,
    setDexEndless,

    // Helpers
    updateDex,
    recordSeen,
    recordDefeated,
  };
}
