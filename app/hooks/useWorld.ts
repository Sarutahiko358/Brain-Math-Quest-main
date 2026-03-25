/**
 * useWorld Hook - World state management
 * Phase 2: Mirror mode - syncs from player state (read-only)
 * Future phases will add world.move() and event handling
 */

import { useState, useCallback } from 'react';
import { Player } from '../lib/gameTypes';
import { Vec } from '../lib/world/areas';

export interface WorldState {
  currentArea: number;
  playerPos: Vec;
}

export interface WorldAPI {
  state: WorldState;
  syncFromPlayer: (player: Player) => void;
}

/**
 * useWorld hook - manages world state independently
 * Currently in mirror mode: syncs from player state
 */
export function useWorld(): WorldAPI {
  const [state, setState] = useState<WorldState>({
    currentArea: 1,
    playerPos: { r: 2, c: 2 }
  });

  const syncFromPlayer = useCallback((player: Player) => {
    setState({
      currentArea: player.currentArea,
      playerPos: player.pos
    });
  }, []);

  return {
    state,
    syncFromPlayer
  };
}
