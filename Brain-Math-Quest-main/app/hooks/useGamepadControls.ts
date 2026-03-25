import { useEffect, useRef } from 'react';
import { Scene, BattleState } from '../lib/gameTypes';
import { UI_TIMINGS } from '../lib/ui/constants';

/**
 * Dependencies required for gamepad controls
 */
export interface GamepadControlDeps {
  scene: Scene;
  battle: BattleState | null;
  tryMove: (dr: number, dc: number) => void;
  setShowMenu: (show: boolean) => void;
  startBrainQuiz: (pack: "attack" | "fire" | "heal" | "run") => void;
}

/**
 * Gamepad button mapping (standard gamepad layout)
 */
const GAMEPAD_BUTTONS = {
  A: 0,        // A button (attack/confirm)
  B: 1,        // B button (run/cancel)
  X: 2,        // X button
  Y: 3,        // Y button
  LB: 4,       // Left bumper
  RB: 5,       // Right bumper
  LT: 6,       // Left trigger
  RT: 7,       // Right trigger
  SELECT: 8,   // Select/Back button
  START: 9,    // Start button (menu)
  L3: 10,      // Left stick button
  R3: 11,      // Right stick button
  UP: 12,      // D-pad up
  DOWN: 13,    // D-pad down
  LEFT: 14,    // D-pad left
  RIGHT: 15,   // D-pad right
} as const;

/**
 * Axis threshold for detecting stick movement
 */
const AXIS_THRESHOLD = 0.5;

/**
 * Direction state for tracking continuous movement
 */
interface DirectionState {
  dr: number;
  dc: number;
}

/**
 * Extended ref type to store timeout ID
 */
interface RepeatIntervalRef {
  current: number | null;
  timeoutId?: number;
}

/**
 * useGamepadControls Hook
 *
 * Manages gamepad/controller input for map movement and battle commands.
 * Supports both D-pad and analog stick for movement.
 * Enables continuous movement when holding direction buttons.
 *
 * Map Controls:
 * - D-pad / Left Stick: Movement
 * - Start: Open menu
 *
 * Battle Controls:
 * - A: Attack (Fire)
 * - B: Run (Escape)
 *
 * @param deps - Dependencies containing scene, battle state, and action handlers
 *
 * @example
 * ```tsx
 * useGamepadControls({
 *   scene,
 *   battle,
 *   tryMove: (dr, dc) => handleMove(dr, dc),
 *   setShowMenu: (show) => setMenuVisible(show),
 *   startBrainQuiz: (pack) => handleQuizStart(pack)
 * });
 * ```
 */
export function useGamepadControls(deps: GamepadControlDeps) {
  const { scene, battle } = deps;

  const directionRef = useRef<DirectionState | null>(null);
  const repeatIntervalRef = useRef<RepeatIntervalRef>({ current: null });
  const buttonStateRef = useRef<Record<number, boolean>>({});

  // Keep refs to latest callbacks to avoid recreating effect
  const depsRef = useRef(deps);
  useEffect(() => {
    depsRef.current = deps;
  });

  useEffect(() => {
    let animationFrameId: number;

    const getDirectionFromGamepad = (gamepad: Gamepad): { dr: number; dc: number } => {
      let dr = 0;
      let dc = 0;

      // Debug: Log button states
      const upPressed = gamepad.buttons[GAMEPAD_BUTTONS.UP]?.pressed;
      const downPressed = gamepad.buttons[GAMEPAD_BUTTONS.DOWN]?.pressed;
      const leftPressed = gamepad.buttons[GAMEPAD_BUTTONS.LEFT]?.pressed;
      const rightPressed = gamepad.buttons[GAMEPAD_BUTTONS.RIGHT]?.pressed;

      // D-pad
      if (upPressed) {
        dr = -1;
      } else if (downPressed) {
        dr = 1;
      }

      if (leftPressed) {
        dc = -1;
      } else if (rightPressed) {
        dc = 1;
      }

      // Left analog stick (axes 0 = horizontal, 1 = vertical)
      if (dr === 0 && dc === 0) {
        const horizontalAxis = gamepad.axes[0];
        const verticalAxis = gamepad.axes[1];

        if (Math.abs(verticalAxis) > AXIS_THRESHOLD) {
          dr = verticalAxis > 0 ? 1 : -1;
        }

        if (Math.abs(horizontalAxis) > AXIS_THRESHOLD) {
          dc = horizontalAxis > 0 ? 1 : -1;
        }
      }

      // Prevent diagonal movement (prioritize vertical)
      if (dr !== 0 && dc !== 0) {
        dc = 0;
      }

      return { dr, dc };
    };

    const startContinuousMovement = () => {
      // Clear old interval if exists
      if (repeatIntervalRef.current.current) {
        window.clearInterval(repeatIntervalRef.current.current);
        repeatIntervalRef.current.current = null;
      }

      // Set up continuous movement after delay
      const timeoutId = window.setTimeout(() => {
        const intervalId = window.setInterval(() => {
          if (directionRef.current) {
            depsRef.current.tryMove(directionRef.current.dr, directionRef.current.dc);
          }
        }, UI_TIMINGS.PAD_REPEAT_INTERVAL);
        repeatIntervalRef.current.current = intervalId;
      }, UI_TIMINGS.PAD_LONG_PRESS_DELAY);

      repeatIntervalRef.current.timeoutId = timeoutId;
    };

    const stopContinuousMovement = () => {
      if (repeatIntervalRef.current.current) {
        window.clearInterval(repeatIntervalRef.current.current);
        repeatIntervalRef.current.current = null;
      }
      if (repeatIntervalRef.current.timeoutId) {
        window.clearTimeout(repeatIntervalRef.current.timeoutId);
        repeatIntervalRef.current.timeoutId = undefined;
      }
    };

    const handleMapInput = (gamepad: Gamepad) => {
      // Handle menu button (Start)
      if (gamepad.buttons[GAMEPAD_BUTTONS.START]?.pressed && !buttonStateRef.current[GAMEPAD_BUTTONS.START]) {
        depsRef.current.setShowMenu(true);
        buttonStateRef.current[GAMEPAD_BUTTONS.START] = true;
      } else if (!gamepad.buttons[GAMEPAD_BUTTONS.START]?.pressed) {
        buttonStateRef.current[GAMEPAD_BUTTONS.START] = false;
      }

      // Handle movement
      const { dr, dc } = getDirectionFromGamepad(gamepad);

      if (dr !== 0 || dc !== 0) {
        const currentDirection = directionRef.current;

        // Check if direction changed
        if (!currentDirection || currentDirection.dr !== dr || currentDirection.dc !== dc) {
          directionRef.current = { dr, dc };
          depsRef.current.tryMove(dr, dc);
          startContinuousMovement();
        }
      } else {
        // No direction input - clear state
        if (directionRef.current) {
          directionRef.current = null;
          stopContinuousMovement();
        }
      }
    };

    const handleBattleInput = (gamepad: Gamepad) => {
      if (!depsRef.current.battle || depsRef.current.battle.mode !== "select") return;

      // A button - Attack
      if (gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed && !buttonStateRef.current[GAMEPAD_BUTTONS.A]) {
        depsRef.current.startBrainQuiz("attack");
        buttonStateRef.current[GAMEPAD_BUTTONS.A] = true;
      } else if (!gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed) {
        buttonStateRef.current[GAMEPAD_BUTTONS.A] = false;
      }

      // B button - Run
      if (gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed && !buttonStateRef.current[GAMEPAD_BUTTONS.B]) {
        depsRef.current.startBrainQuiz("run");
        buttonStateRef.current[GAMEPAD_BUTTONS.B] = true;
      } else if (!gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed) {
        buttonStateRef.current[GAMEPAD_BUTTONS.B] = false;
      }
    };

    const pollGamepads = () => {
      const gamepads = navigator.getGamepads?.();
      if (!gamepads) {
        animationFrameId = requestAnimationFrame(pollGamepads);
        return;
      }

      // Find first connected gamepad
      const gamepad = Array.from(gamepads).find(gp => gp?.connected);
      if (!gamepad) {
        // Clear direction state if no gamepad connected
        if (directionRef.current) {
          directionRef.current = null;
          if (repeatIntervalRef.current.current) {
            window.clearInterval(repeatIntervalRef.current.current);
            repeatIntervalRef.current.current = null;
          }
        }
        animationFrameId = requestAnimationFrame(pollGamepads);
        return;
      }

      if (depsRef.current.scene === "map") {
        handleMapInput(gamepad);
      } else if (depsRef.current.scene === "battle") {
        handleBattleInput(gamepad);
      }

      animationFrameId = requestAnimationFrame(pollGamepads);
    };

    // Start polling
    animationFrameId = requestAnimationFrame(pollGamepads);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (repeatIntervalRef.current.current) {
        window.clearInterval(repeatIntervalRef.current.current);
      }
      if (repeatIntervalRef.current.timeoutId) {
        window.clearTimeout(repeatIntervalRef.current.timeoutId);
      }
    };
  }, [scene, battle]);
}
