import { useState } from 'react';
import { QuizBundle } from '../lib/quiz/types';
import { Enemy } from '../lib/enemies';
import { BrainOnlyMode, BrainOnlyRecord, BrainEnemyAnim } from '../game/types';
import { Settings } from '../lib/settings';

/**
 * Brain-Only mode state management hook
 * Consolidates 9 separate states into a single, cohesive hook
 * Improves maintainability and reduces DQBrain.tsx complexity
 */

export interface BrainOnlyState {
  // Current quiz
  quiz: QuizBundle | null;

  // Statistics
  stats: {
    total: number;
    correct: number;
    totalTime: number;
    streak: number;
    maxStreak: number;
  };

  // UI overlays
  showSetup: boolean;
  showConfig: boolean;
  showResult: boolean;

  // Configuration draft (for editing before applying)
  draft: Settings['brainOnly'] | null;

  // Enemy display
  enemy: Enemy | null;
  enemyAnim: BrainEnemyAnim | null;

  // Run configuration
  mode: BrainOnlyMode;
  target: number; // Fixed mode: number of questions, Timed mode: seconds

  // Records history
  records: BrainOnlyRecord[];
}

export interface BrainOnlyActions {
  setQuiz: (quiz: QuizBundle | null | ((prev: QuizBundle | null) => QuizBundle | null)) => void;
  setStats: (stats: BrainOnlyState['stats'] | ((prev: BrainOnlyState['stats']) => BrainOnlyState['stats'])) => void;
  setShowSetup: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowConfig: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowResult: (show: boolean | ((prev: boolean) => boolean)) => void;
  setDraft: (draft: Settings['brainOnly'] | null | ((prev: Settings['brainOnly'] | null) => Settings['brainOnly'] | null)) => void;
  setEnemy: (enemy: Enemy | null | ((prev: Enemy | null) => Enemy | null)) => void;
  setEnemyAnim: (anim: BrainEnemyAnim | null | ((prev: BrainEnemyAnim | null) => BrainEnemyAnim | null)) => void;
  setMode: (mode: BrainOnlyMode | ((prev: BrainOnlyMode) => BrainOnlyMode)) => void;
  setTarget: (target: number | ((prev: number) => number)) => void;
  setRecords: (records: BrainOnlyRecord[] | ((prev: BrainOnlyRecord[]) => BrainOnlyRecord[])) => void;

  // Convenience methods
  resetStats: () => void;
  incrementCorrect: (timeSpent: number) => void;
  incrementIncorrect: () => void;
  addRecord: (record: BrainOnlyRecord) => void;
  closeAllOverlays: () => void;
}

const initialStats: BrainOnlyState['stats'] = {
  total: 0,
  correct: 0,
  totalTime: 0,
  streak: 0,
  maxStreak: 0,
};

export function useBrainOnlyMode() {
  const [quiz, setQuiz] = useState<QuizBundle | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [showSetup, setShowSetup] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [draft, setDraft] = useState<Settings['brainOnly'] | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [enemyAnim, setEnemyAnim] = useState<BrainEnemyAnim | null>(null);
  const [mode, setMode] = useState<BrainOnlyMode>('fixed');
  const [target, setTarget] = useState(20);
  const [records, setRecords] = useState<BrainOnlyRecord[]>([]);

  const resetStats = () => {
    setStats(initialStats);
  };

  const incrementCorrect = (timeSpent: number) => {
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + 1,
      totalTime: prev.totalTime + timeSpent,
      streak: prev.streak + 1,
      maxStreak: Math.max(prev.maxStreak, prev.streak + 1),
    }));
  };

  const incrementIncorrect = () => {
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      streak: 0,
    }));
  };

  const addRecord = (record: BrainOnlyRecord) => {
    setRecords(prev => [...prev, record]);
  };

  const closeAllOverlays = () => {
    setShowSetup(false);
    setShowConfig(false);
    setShowResult(false);
  };

  const state: BrainOnlyState = {
    quiz,
    stats,
    showSetup,
    showConfig,
    showResult,
    draft,
    enemy,
    enemyAnim,
    mode,
    target,
    records,
  };

  const actions: BrainOnlyActions = {
    setQuiz,
    setStats,
    setShowSetup,
    setShowConfig,
    setShowResult,
    setDraft,
    setEnemy,
    setEnemyAnim,
    setMode,
    setTarget,
    setRecords,
    resetStats,
    incrementCorrect,
    incrementIncorrect,
    addRecord,
    closeAllOverlays,
  };

  return { state, actions };
}
