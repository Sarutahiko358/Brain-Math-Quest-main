import { useEffect, useRef } from 'react';
import { Scene, BattleState } from '../lib/gameTypes';
import { UI_TIMINGS } from '../lib/ui/constants';

/**
 * Dependencies required for keyboard controls
 */
export interface KeyboardControlDeps {
  scene: Scene;
  battle: BattleState | null;
  tryMove: (dr: number, dc: number) => void;
  setShowMenu: (show: boolean) => void;
  startBrainQuiz: (pack: "attack" | "fire" | "heal" | "run") => void;
}

/**
 * Key mapping for movement controls
 */
const MOVEMENT_KEYS: Record<string, [number, number]> = {
  'ArrowUp': [-1, 0], 'w': [-1, 0], 'W': [-1, 0],
  'ArrowDown': [1, 0], 's': [1, 0], 'S': [1, 0],
  'ArrowLeft': [0, -1], 'a': [0, -1], 'A': [0, -1],
  'ArrowRight': [0, 1], 'd': [0, 1], 'D': [0, 1],
};

/**
 * Direction state for tracking continuous movement
 */
interface KeyDirectionState {
  key: string;
  dr: number;
  dc: number;
}

/**
 * Handles keyboard input for battle scene
 */
function handleBattleKeyPress(
  key: string,
  battle: BattleState | null,
  startBrainQuiz: (pack: "attack" | "fire" | "heal" | "run") => void
): void {
  if (!battle || battle.mode !== "select") return;

  const lowerKey = key.toLowerCase();
  if (lowerKey === 'f') {
    startBrainQuiz("attack");
  } else if (lowerKey === 'r') {
    startBrainQuiz("run");
  }
  // 誤操作防止: Enter/Spaceでのログ送りは無効化（専用ボタンのみ）
}

/**
 * useKeyboardControls Hook
 *
 * Manages keyboard controls for map movement and battle commands.
 * Now supports continuous movement when holding down movement keys.
 *
 * Map Controls:
 * - Arrow keys / WASD: Movement (supports hold for continuous movement)
 * - M: Open menu
 *
 * Battle Controls:
 * - F: Attack (Fire)
 * - R: Run (Escape)
 *
 * @param deps - Dependencies containing scene, battle state, and action handlers
 *
 * @example
 * ```tsx
 * useKeyboardControls({
 *   scene,
 *   battle,
 *   tryMove: (dr, dc) => handleMove(dr, dc),
 *   setShowMenu: (show) => setMenuVisible(show),
 *   startBrainQuiz: (pack) => handleQuizStart(pack)
 * });
 * ```
 */
export function useKeyboardControls(deps: KeyboardControlDeps) {
  const { scene, battle } = deps;

  const currentDirectionRef = useRef<KeyDirectionState | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);
  const repeatTimeoutRef = useRef<number | null>(null);

  // Keep refs to latest callbacks to avoid recreating effect
  const depsRef = useRef(deps);
  useEffect(() => {
    depsRef.current = deps;
  });

  useEffect(() => {
    const clearRepeat = () => {
      if (repeatTimeoutRef.current) {
        window.clearTimeout(repeatTimeoutRef.current);
        repeatTimeoutRef.current = null;
      }
      if (repeatIntervalRef.current) {
        window.clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
    };

    const startRepeat = (key: string, dr: number, dc: number) => {
      clearRepeat();
      currentDirectionRef.current = { key, dr, dc };

      // Set up continuous movement after delay
      repeatTimeoutRef.current = window.setTimeout(() => {
        repeatIntervalRef.current = window.setInterval(() => {
          if (currentDirectionRef.current) {
            depsRef.current.tryMove(currentDirectionRef.current.dr, currentDirectionRef.current.dc);
          }
        }, UI_TIMINGS.PAD_REPEAT_INTERVAL);
      }, UI_TIMINGS.PAD_LONG_PRESS_DELAY);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent repeat if key is already being held (browser native repeat)
      if (e.repeat) {
        e.preventDefault();
        return;
      }

      if (depsRef.current.scene === "map") {
        const movement = MOVEMENT_KEYS[e.key];
        if (movement) {
          depsRef.current.tryMove(movement[0], movement[1]);
          startRepeat(e.key, movement[0], movement[1]);
          return;
        }

        if (e.key === 'm' || e.key === 'M') {
          depsRef.current.setShowMenu(true);
        }
      } else if (depsRef.current.scene === "battle") {
        handleBattleKeyPress(e.key, depsRef.current.battle, depsRef.current.startBrainQuiz);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (depsRef.current.scene === "map") {
        // If the released key matches current direction, stop repeating
        if (currentDirectionRef.current && currentDirectionRef.current.key === e.key) {
          clearRepeat();
          currentDirectionRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearRepeat();
    };
  }, [scene, battle]);
}
