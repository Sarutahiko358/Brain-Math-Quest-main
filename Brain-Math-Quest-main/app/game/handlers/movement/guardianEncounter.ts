/**
 * Guardian Encounter Handler
 * Extracted from handleTryMove.ts for better code organization
 */

import { Player, BattleState } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { isAtPosition } from '../../../lib/world/movement';
import { GUARDIANS_A7 } from '../../../lib/world/areas';
import { prepareGuardianEnemy, getGuardianReward, GUARDIAN_NAMES } from '../../../lib/world/guardianEncounter';
import { TimerManager } from '../../../lib/timerManager';

export interface GuardianEncounterDeps {
  timerManager: TimerManager;
  settings: Settings;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: 'map' | 'battle') => void;
  setShowStory: (story: string | null) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
  equipAccessory: (name: string) => void;
}

/**
 * Check if player is at a guardian position and trigger encounter if needed
 * Returns true if guardian encounter was triggered
 */
export function checkGuardianEncounter(
  player: Player,
  newPos: { r: number; c: number },
  deps: GuardianEncounterDeps
): boolean {
  if (player.currentArea !== 7) return false;

  const f = player.flags || {};
  const { timerManager, settings, setPlayer, setBattle, setScene, setShowStory, addToast, recordSeen, equipAccessory } = deps;

  // Helper to start guardian encounter
  const startGuardianEncounter = (guardianName: string) => {
    setShowStory("bossEncounter");
    timerManager.setTimeout(() => {
      const enemy = prepareGuardianEnemy(guardianName, settings.difficulty);
      if (enemy) {
        const rewardName = getGuardianReward(guardianName);
        setBattle(() => ({
          enemy,
          log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
          queue: [],
          mode: "queue",
          quizStats: { total: 0, correct: 0, totalTime: 0 },
          onVictory: () => {
            if (rewardName) {
              setPlayer(p => ({
                ...p,
                keyItems: p.keyItems.includes(rewardName) ? p.keyItems : [...p.keyItems, rewardName]
              }));
              addToast(`${rewardName} を手に入れた！（認められた証）`);
              equipAccessory(rewardName);
            }
          }
        }));
        setScene("battle");
        recordSeen(enemy.name);
      }
    }, 200);
  };

  // Check each guardian position
  if (isAtPosition(newPos, GUARDIANS_A7.genbu) && !f.genbuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.GENBU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.seiryu) && !f.seiryuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.SEIRYU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.suzaku) && !f.suzakuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.SUZAKU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.byakko) && !f.byakkoDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.BYAKKO);
    return true;
  }

  return false;
}
