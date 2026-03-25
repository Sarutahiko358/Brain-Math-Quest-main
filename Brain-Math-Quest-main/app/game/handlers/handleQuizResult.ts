/**
 * Quiz Result Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles quiz result processing and battle flow.
 * Original location: DQBrain.tsx lines 949-1451
 */

import { Player, BattleState, Scene, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { BattleAnimState, DexData, EquipDexState, DojoMode } from '../types';
import { LevelUpInfo, LevelUpDetail } from '../../lib/battle/flow';
import { TimerManager } from '../../lib/timerManager';
import { handleHealAction, handleRunAction, handleSuccessfulAttack, handleFailedAttack } from './actionHandlers';

export interface QuizResultDeps {
  timerManager: TimerManager;
  battle: BattleState | null;
  player: Player;
  gameMode: GameMode;
  quizCombo: number;
  settings: Settings;
  equipDex: EquipDexState;
  currentAreaInfo: { bossName: string };
  enemyPanelRef: React.RefObject<HTMLDivElement | null>;
  currentDex: DexData;
  dojoMode: DojoMode | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setScene: (scene: Scene) => void;
  setShowStory: (story: "bossVictory" | "bossEncounter" | null) => void;
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
  giveExpGold: (exp: number, gold: number) => { levelUp?: LevelUpInfo, details?: LevelUpDetail[] };
  recordDefeated: (name: string) => void;
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void;
}

export function handleQuizResult(ok: boolean, pack: "attack" | "fire" | "heal" | "run", _power: number, deps: QuizResultDeps) {
  const {
    battle,
    setBattle
  } = deps;

  // S10 Phase 3: Quiz result adapter layer integration with useGameState
  //
  // INTEGRATION APPROACH:
  // - Core quiz resolution uses shared engine functions (processAttackResult, processHealResult, processRunResult)
  // - useGameState.actions.resolveQuiz provides equivalent quiz resolution logic
  // - Both use the same quiz engine from lib/quiz/engine.ts, ensuring behavior parity
  // - DQBrain adds: animations, UI feedback, combo guard system, enemy strike sequence
  // - Full delegation would require coordinating state updates between gameState and DQBrain
  //
  // CURRENT STATE: Using quiz engine functions directly with DQBrain state management
  // FUTURE STATE: Could delegate result calculation to gameState while handling animations in DQBrain

  if (!battle || !battle.quiz) return;

  // クイズ統計を更新（更新後のスナップショットを作成してハンドラに渡す）
  // クイズ統計を更新（更新後スナップショットを作成して渡す）
  const timeSpent = battle.quiz.timeStart ? (Date.now() - battle.quiz.timeStart) / 1000 : 0;

  const updatedStats = {
    total: battle.quizStats.total + 1,
    correct: battle.quizStats.correct + (ok ? 1 : 0),
    totalTime: battle.quizStats.totalTime + timeSpent
  };

  const updatedTestMode = battle.testMode ? {
    ...battle.testMode,
    questionsAsked: battle.testMode.questionsAsked + 1,
    correctAnswers: battle.testMode.correctAnswers + (ok ? 1 : 0)
  } : undefined;

  const nextBattle: BattleState = {
    ...battle,
    quizStats: updatedStats,
    testMode: updatedTestMode
  };

  // 状態を更新
  setBattle(() => nextBattle);

  // Delegate to action-specific handlers with updated battle snapshot
  const actionDeps = { ...deps, battle: nextBattle };

  if (pack === "heal") {
    handleHealAction(ok, timeSpent, actionDeps);
    return;
  }

  if (pack === "run") {
    handleRunAction(ok, timeSpent, actionDeps);
    return;
  }

  // attack / fire
  if (ok) {
    handleSuccessfulAttack(pack, timeSpent, actionDeps);
  } else {
    handleFailedAttack(pack, timeSpent, actionDeps);
  }
}
