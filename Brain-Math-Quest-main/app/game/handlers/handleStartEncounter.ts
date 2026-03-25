/**
 * Encounter Initialization Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles encounter initiation.
 * Original location: DQBrain.tsx lines ~641-683
 */

import { Tile } from '../../lib/world/areas';
import { BattleState, Scene, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { prepareEncounter } from '../../lib/world/encounterAdapter';
import { getEncounterIntroLines } from '../../lib/world/bossEncounter';
import { DexData } from '../types';

export interface StartEncounterDeps {
  player: { currentArea: number; endlessFloor?: number };
  gameMode: GameMode;
  settings: Settings;
  currentDex: DexData;
  pick: <T>(arr: T[]) => T;
  setBattle: (battle: BattleState) => void;
  setScene: (scene: Scene) => void;
  recordSeen: (name: string) => void;
}

export function handleStartEncounter(tile: Tile, deps: StartEncounterDeps) {
  const { player, gameMode, settings, currentDex, pick, setBattle, setScene, recordSeen } = deps;
  
  // S10 Step2: Encounter adapter layer integration (COMPLETED)
  //
  // CHANGES:
  // - Enemy selection and scaling now uses prepareEncounter adapter
  // - Delegates to shared helpers (pickEnemy, scaleEnemy, getAvailableEnemies, scaleStats)
  // - Reduces duplication while maintaining exact behavior
  // - Handles all game modes: normal, boss rush (area 9), endless
  //
  // INTEGRATION APPROACH:
  // - prepareEncounter provides pure enemy preparation (no side effects)
  // - Returns prepared enemy with stats or null if no encounter
  // - DQBrain continues to handle battle state setup and UI transitions
  
  // Use encounter adapter for enemy preparation
  const encounterResult = prepareEncounter({
    currentArea: player.currentArea,
    gameMode,
    endlessFloor: player.endlessFloor,
    difficulty: settings.difficulty,
    tile,
    pickFn: pick
  });

  if (!encounterResult) {
    // それでも選べない場合は遭遇をスキップ（安全策）
    return;
  }
  
  const { enemy, isBossRush, isEndless } = encounterResult;
  
  // 登場セリフ (use extracted function)
  const intro: string[] = getEncounterIntroLines(enemy, {
    isKirin: enemy.name === '九尾の麒麟',
    isEndless,
    isBossRush,
    floor: player.endlessFloor || 1,
    kirinAttempt: (currentDex[enemy.name]?.seen || 0) + 1,
  });
  setBattle({ enemy, log: [intro[0]], queue: intro.slice(1), mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 } });
  setScene("battle");
  recordSeen(enemy.name);
}
