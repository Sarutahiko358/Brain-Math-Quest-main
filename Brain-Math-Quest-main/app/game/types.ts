/**
 * DQBrain Component Types
 * 
 * Local types and interfaces used by DQBrain.tsx that don't belong
 * in shared lib files due to their UI-specific or component-local nature.
 */

import { QuizType } from '../lib/quiz/types';
import { LevelUpInfo, LevelUpDetail } from '../lib/battle/flow';

// Brain-only mode types
export type BrainOnlyMode = 'fixed' | 'endless';

export interface BrainOnlyStats {
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
  totalTime: number;
}

export interface BrainOnlyRecord {
  ok: boolean;
  time: number;
  type?: QuizType;
}

// Battle animation state
export interface BattleAnimState {
  type: string;
  value?: number;
}

export type BrainEnemyAnim = "flash" | "shake";

// Dialog states
export interface LevelUpDialogState {
  visible: boolean;
  info?: LevelUpInfo;
  details?: LevelUpDetail[];
}

export interface ConfirmDialogState {
  visible: boolean;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Dex (bestiary) types
export interface DexRecord {
  seen: number;
  defeated: number;
}

export type DexData = Record<string, DexRecord>;

export interface EquipDexState {
  weapons: string[];
  armors: string[];
}

// UI overlay types
export type TownMenu = "menu" | "weapon" | "tool" | "inn";

export type DojoMode = 'arithmetic' | 'random' | 'hard';

export type SettingsTab = "rpg" | "brain";
