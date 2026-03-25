/**
 * Boss Encounter Handler
 * Extracted from handleTryMove.ts for better code organization
 */

import { Player, BattleState, GameMode } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { isAtPosition } from '../../../lib/world/movement';
import { AreaInfo } from '../../../lib/world/areas';
import { allGuardiansDefeated } from '../../../lib/world/guardianEncounter';
import { BOSS_POOL } from '../../../lib/enemies';
import { getKirinIntroLines } from '../../../lib/world/bossEncounter';
import { getFloorBoss, scaleStats } from '../../../lib/world/endless';
import { DexData } from '../../types';
import { TimerManager } from '../../../lib/timerManager';

export interface BossEncounterDeps {
  timerManager: TimerManager;
  gameMode: GameMode;
  settings: Settings;
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: 'map' | 'battle') => void;
  setShowStory: (story: string | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
}

/**
 * Check if player is at boss position and trigger encounter if needed
 * Returns true if encounter was triggered, false if player should stop moving
 */
export function checkBossEncounter(
  player: Player,
  newPos: { r: number; c: number },
  deps: BossEncounterDeps
): { triggered: boolean; shouldStopMoving: boolean } {
  const { timerManager, gameMode, settings, currentAreaInfo, currentDex, setBattle, setScene, setShowStory, setPlayer, addToast, recordSeen } = deps;

  if (!isAtPosition(newPos, currentAreaInfo.bossPos)) {
    return { triggered: false, shouldStopMoving: false };
  }

  // Area 7: Check if all guardians are defeated
  if (player.currentArea === 7) {
    const f = player.flags || {};
    if (!allGuardiansDefeated(f)) {
      addToast("四方に散る四聖獣のもとへ向かい、すべての試練を越えよ。");
      return { triggered: false, shouldStopMoving: false };
    }
  }

  const alwaysFightHere = player.currentArea === 9;
  const isEndlessMode = gameMode === 'endless';
  const bossDefeated = ((): number => {
    if (alwaysFightHere || isEndlessMode) return 0;
    if (player.currentArea === 7) {
      const f = player.flags || {};
      return allGuardiansDefeated(f) ? 1 : 0;
    }
    return currentDex[currentAreaInfo.bossName]?.defeated || 0;
  })();

  if (!(alwaysFightHere || isEndlessMode || bossDefeated === 0)) {
    return { triggered: false, shouldStopMoving: true };
  }

  // Endless mode floor boss
  if (isEndlessMode) {
    if ((window as typeof window & { __advancingFloor?: boolean }).__advancingFloor) {
      return { triggered: false, shouldStopMoving: true };
    }
    (window as typeof window & { __advancingFloor?: boolean }).__advancingFloor = true;
    setShowStory("bossEncounter");
    timerManager.setTimeout(() => {
      const floor = player.endlessFloor || 1;
      const bossBase = getFloorBoss(floor);
      const bossStats = scaleStats(floor, 'boss');
      const jitter = 0.9 + Math.random() * 0.2;
      const enemy = {
        ...bossBase,
        maxHP: Math.round(bossStats.maxHP * jitter),
        hp: Math.round(bossStats.hp * jitter),
        atk: Math.round(bossStats.atk * jitter),
        renderSize: Math.round((bossBase.renderSize || 160) * 1.5)
      };
      const lines = [`💀 第${floor}階層 フロアボス\n${enemy.emoji} ${enemy.name} が あらわれた！`];
      setBattle(() => ({
        enemy,
        log: [lines[0]],
        queue: [],
        mode: "queue",
        quizStats: { total: 0, correct: 0, totalTime: 0 },
        onVictory: () => {
          setPlayer(p => {
            const nextFloor = (p.endlessFloor || 1) + 1;
            addToast(`👑 第${floor}階層 クリア！ 第${nextFloor}階層へ進む…`);
            return {
              ...p,
              endlessFloor: nextFloor,
              pos: currentAreaInfo.startPos
            };
          });
        }
      }));
      setScene("battle");
      recordSeen(enemy.name);
      timerManager.setTimeout(() => { (window as typeof window & { __advancingFloor?: boolean }).__advancingFloor = false; }, 300);
    }, 800);
    return { triggered: true, shouldStopMoving: true };
  }

  // Normal area boss battle
  setShowStory("bossEncounter");
  timerManager.setTimeout(() => {
    const bossData = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName);
    if (bossData) {
      const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
      const enemy = { ...bossData };
      enemy.maxHP = Math.round(enemy.maxHP * dmul);
      enemy.hp = enemy.maxHP;
      enemy.atk = Math.round(enemy.atk * dmul);
      const baseSize = enemy.renderSize || 160;
      enemy.renderSize = Math.round(baseSize * 1.5);
      const lines = (enemy.name === '九尾の麒麟')
        ? getKirinIntroLines(((currentDex[enemy.name]?.seen || 0) + 1), 'boss', enemy)
        : [`${enemy.emoji} ${enemy.name} が あらわれた！`];

      // Library mode: Set test mode parameters based on boss type
      const testMode = gameMode === 'library' ? (() => {
        // Final boss (Area 9): 15 questions, 10 required
        if (player.currentArea === 9) {
          return { totalQuestions: 15, requiredCorrect: 10, questionsAsked: 0, correctAnswers: 0 };
        }
        // Kirin (Area 8): 10 questions, 7 required
        if (player.currentArea === 8 || enemy.name === '麒麟') {
          return { totalQuestions: 10, requiredCorrect: 7, questionsAsked: 0, correctAnswers: 0 };
        }
        // Four Sacred Beasts (Area 6): 10 questions total, 6 required
        if (player.currentArea === 6) {
          return { totalQuestions: 10, requiredCorrect: 6, questionsAsked: 0, correctAnswers: 0 };
        }
        // Normal bosses: 10 questions, 6 required
        return { totalQuestions: 10, requiredCorrect: 6, questionsAsked: 0, correctAnswers: 0 };
      })() : undefined;

      setBattle(() => ({ enemy, log: [lines[0]], queue: lines.slice(1), mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 }, testMode }));
      setScene("battle");
      recordSeen(enemy.name);
    }
  }, 1200);
  return { triggered: true, shouldStopMoving: true };
}
