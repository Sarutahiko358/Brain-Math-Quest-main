/**
 * Brain-Only Mode Result Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles brain-only quiz results.
 * Original location: DQBrain.tsx lines ~1127-1164
 */

import { QuizBundle, QuizType } from '../../lib/quiz/types';
import { BrainOnlyMode, BrainEnemyAnim } from '../types';
import { TimerManager } from '../../lib/timerManager';

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

  // Calculate next count BEFORE state updates to avoid timing issues
  const nextCount = brainOnlyStats.total + 1;
  const finishedFixed = (brainOnlyMode === 'fixed') && (nextCount >= brainOnlyTarget);

  // record per-question result
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

  // Wait a bit before proceeding
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
