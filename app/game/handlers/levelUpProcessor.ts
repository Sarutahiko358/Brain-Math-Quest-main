/**
 * Level Up Processor
 *
 * Handles level-up display logic and message generation.
 * Extracted from handleQuizResult.ts to reduce complexity.
 */

import { LevelUpInfo, LevelUpDetail } from '../../lib/battle/flow';
import { BattleState } from '../../lib/gameTypes';

export interface LevelUpResult {
  messages: string[];
  queueEntries: string[];
}

/**
 * Process level-up information and generate display messages
 *
 * @param levelUpInfo - Level-up information from giveExpGold
 * @param details - Detailed level-up breakdown per level
 * @returns Messages and queue entries for battle log
 */
export function processLevelUpDisplay(
  levelUpInfo: LevelUpInfo | undefined,
  details: LevelUpDetail[] | undefined
): LevelUpResult {
  const messages: string[] = [];
  const queueEntries: string[] = [];

  if (!levelUpInfo) {
    return { messages, queueEntries };
  }

  // Add level-up announcement
  messages.push('');
  messages.push(
    `🎉 レベルアップ！ Lv${levelUpInfo.oldLv} → Lv${levelUpInfo.newLv}`
  );

  // Generate detailed breakdown for queue
  if (details && details.length > 0) {
    details.forEach((d) => {
      const entry = `  └ Lv${d.fromLv} → Lv${d.toLv}：HP +${d.hp} / MP +${d.mp} / ATK +${d.atk} / DEF +${d.def}`;
      queueEntries.push(entry);
    });
  }

  return { messages, queueEntries };
}

/**
 * Apply level-up messages and queue entries to battle state
 *
 * @param battle - Current battle state
 * @param result - Level-up processing result
 * @param pushLog - Function to push messages to battle log
 * @param setBattle - Function to update battle state
 */
export function applyLevelUpDisplay(
  battle: BattleState | null,
  result: LevelUpResult,
  pushLog: (msg: string) => void,
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void
): void {
  // Push messages to log
  result.messages.forEach((msg) => pushLog(msg));

  // Add queue entries to battle state
  if (result.queueEntries.length > 0 && battle) {
    setBattle((b) =>
      b
        ? {
            ...b,
            queue: [...b.queue, ...result.queueEntries]
          }
        : b
    );
  }
}
