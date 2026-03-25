/**
 * Heal Action Handler
 *
 * Handles heal action quiz results with state updates and animations.
 * Extracted from actionHandlers.ts for better modularity.
 */

import { Player, BattleState } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { processHealResult } from '../../../lib/quiz/engine';
import { clamp } from '../../../lib/uiLayout';
import { BattleAnimState } from '../../types';
import { TimerManager } from '../../../lib/timerManager';
import { processComboChange } from '../comboManager';
import { showHealAnimation } from '../battleAnimations';
import { playSoundEffect } from '../handleSoundEffects';

export interface HealActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  player: Player;
  quizCombo: number;
  settings: Settings;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
}

/**
 * Handle heal action result
 *
 * Process flow:
 * 1. Calculate heal outcome from quiz result
 * 2. Apply HP/MP changes to player
 * 3. Update combo state (maintain, increase, or reset)
 * 4. Log messages to battle log
 * 5. Show heal animation
 * 6. Trigger enemy counter-attack if quiz failed
 *
 * @param ok - Whether the quiz was answered correctly
 * @param timeSpent - Time spent on the quiz in seconds
 * @param deps - Action handler dependencies
 */
export function handleHealAction(ok: boolean, timeSpent: number, deps: HealActionDeps): void {
  const {
    battle,
    player,
    quizCombo,
    settings,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    addToast,
    pushLog,
    timerManager,
    vibrate,
    enemyStrike
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Calculate heal outcome
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processHealResult(ok, context, timeSpent);

  // Apply HP/MP changes
  if (outcome.playerHPChange !== undefined) {
    const newHP = clamp(player.hp + outcome.playerHPChange, 0, player.maxHP);
    setPlayer(p => ({
      ...p,
      hp: newHP,
      mp: p.mp + (outcome.playerMPChange || 0)
    }));
  }

  // Update combo state
  processComboChange(outcome.comboChange, player, setPlayer, setQuizCombo, addToast);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Show heal animation
  if (outcome.playerHPChange) {
    showHealAnimation(outcome.playerHPChange, { setBattleAnim, timerManager, vibrate });
    // 回復音を再生（成功時のみ）
    if (ok && outcome.playerHPChange > 0) {
      playSoundEffect('heal', settings.soundEffects);
    }
  }

  // Enemy counter-attack if heal failed
  if (!ok) {
    enemyStrike();
  }
}
