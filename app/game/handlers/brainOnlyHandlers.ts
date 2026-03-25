// ─── brainOnlyHandlers.ts ─────────────────────────────────
// Consolidation of: handleBrainOnlyResult, handleStartBrainOnlyQuiz
// Phase 1: file merge only – no logic changes
// ──────────────────────────────────────────────────────────

import { QuizBundle, QuizType } from '../../lib/quiz/types';
import { Settings } from '../../lib/settings';
import { makeQuizPack } from '../../lib/quiz/generators';
import { Enemy, ENEMY_POOL } from '../../lib/enemies';
import { pick } from '../../lib/rng';
import { BrainOnlyMode, BrainEnemyAnim } from '../types';
import { TimerManager } from '../../lib/timerManager';

// ─── handleStartBrainOnlyQuiz ─────────────────────────────

export interface StartBrainOnlyQuizDeps {
  settings: Settings;
  setBrainEnemy: (enemy: Enemy | null) => void;
  setBrainOnlyQuiz: (quiz: QuizBundle | null) => void;
}

export function handleStartBrainOnlyQuiz(deps: StartBrainOnlyQuizDeps) {
  const { settings, setBrainEnemy, setBrainOnlyQuiz } = deps;
  
  const difficulty = settings.difficulty;
  const pack = 'attack';

  const result = makeQuizPack(difficulty, pack, {
    hardQuizRandom: settings.hardQuizRandom,
    quizTypes: settings.quizTypes.length > 0 ? settings.quizTypes : undefined
  });
  
  try {
    const e = pick(ENEMY_POOL);
    setBrainEnemy(e);
  } catch (error) {
    console.error('Failed to pick brain-only enemy:', error);
  }

  setBrainOnlyQuiz({
    quiz: result.quiz,
    timeMax: result.time,
    timeLeft: result.time,
    timeStart: Date.now(),
    pack: 'attack',
    power: 1
  });
}

// ─── handleBrainOnlyResult ────────────────────────────────

export interface BrainOnlyResultDeps {
  timerManager: TimerManager;
  brainOnlyStats: { total: number; correct: number; totalTime: number; streak: number; maxStreak: number };
  brainOnlyMode: BrainOnlyMode;
  brainOnlyTarget: number;
  setBrainOnlyRecords: (updater: (r: Array<{ ok: boolean; time: number; type?: QuizType }>) => Array<{ ok: boolean; time: number; type?: QuizType }>) => void;
  setBrainOnlyStats: (updater: (s: { total: number; correct: number; totalTime: number; streak: number; maxStreak: number }) => { total: number; correct: number; totalTime: number; streak: number; maxStreak: number }) => void;
  setBrainEnemyAnim: (anim: BrainEnemyAnim | null) => void;
  addToast: (msg: string) => void;
  setShowBrainOnlyResult: (show: boolean) => void;
  setBrainOnlyQuiz: (quiz: QuizBundle | null) => void;
  startBrainOnlyQuiz: () => void;
}

export function handleBrainOnlyResult(ok: boolean, quizBundle: QuizBundle, deps: BrainOnlyResultDeps) {
  const {
    timerManager,
    brainOnlyStats,
    brainOnlyMode,
    brainOnlyTarget,
    setBrainOnlyRecords,
    setBrainOnlyStats,
    setBrainEnemyAnim,
    addToast,
    setShowBrainOnlyResult,
    setBrainOnlyQuiz,
    startBrainOnlyQuiz
  } = deps;

  const timeSpent = quizBundle.timeStart ? (Date.now() - quizBundle.timeStart) / 1000 : 0;

  const nextCount = brainOnlyStats.total + 1;
  const finishedFixed = (brainOnlyMode === 'fixed') && (nextCount >= brainOnlyTarget);

  setBrainOnlyRecords(r => [...r, { ok, time: timeSpent, type: quizBundle.quiz.type }]);

  setBrainOnlyStats(stats => {
    const newStreak = ok ? stats.streak + 1 : 0;
    return {
      total: stats.total + 1,
      correct: stats.correct + (ok ? 1 : 0),
      totalTime: stats.totalTime + timeSpent,
      streak: newStreak,
      maxStreak: Math.max(stats.maxStreak, newStreak)
    };
  });

  if (ok) {
    setBrainEnemyAnim('flash');
    addToast(`⭕ 正解！ (${timeSpent.toFixed(1)}秒)`);
    addToast('⚔️ 撃破！');
  } else {
    setBrainEnemyAnim('shake');
    addToast(`❌ 不正解`);
  }

  timerManager.setTimeout(() => {
    setBrainEnemyAnim(null);
    if (finishedFixed) {
      setShowBrainOnlyResult(true);
      setBrainOnlyQuiz(null);
    } else {
      startBrainOnlyQuiz();
    }
  }, 1000);
}
