/**
 * Run Action Handler
 *
 * Handles escape/run action quiz results with success/failure logic.
 * Extracted from actionHandlers.ts for better modularity.
 */

import { BattleState, Scene } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { isHardQuiz } from '../../../lib/quiz/difficulty';
import { processRunResult } from '../../../lib/quiz/engine';
import { TimerManager } from '../../../lib/timerManager';

export interface RunActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  settings: Settings;
  setScene: (scene: Scene) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  pushLog: (msg: string) => void;
}

/**
 * Handle run/escape action result
 *
 * Process flow:
 * Success path (quiz correct):
 * 1. Log success messages
 * 2. Return to map scene after short delay
 *
 * Failure path (quiz incorrect):
 * 1. Log failure messages
 * 2. Reset combo to 0
 * 3. Call onVictory callback if defined (for scripted battles)
 * 4. Return to map scene after longer delay
 *
 * @param ok - Whether the quiz was answered correctly
 * @param timeSpent - Time spent on the quiz in seconds
 * @param deps - Action handler dependencies
 */
export function handleRunAction(ok: boolean, timeSpent: number, deps: RunActionDeps): void {
  const {
    battle,
    settings,
    setScene,
    setQuizCombo,
    pushLog,
    timerManager
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Calculate run outcome
  const hard = isHardQuiz(battle.quiz.quiz);
  const outcome = processRunResult(ok, timeSpent, settings, hard);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  if (ok) {
    // Successful escape: quick return to map
    timerManager.setTimeout(() => setScene("map"), 120);
  } else {
    // Failed escape: reset combo and delayed return
    setQuizCombo(0);

    // Call onVictory for scripted battles (e.g., forced tutorial escapes)
    if (battle.onVictory) {
      battle.onVictory();
    }

    timerManager.setTimeout(() => setScene("map"), 1200);
  }
}
