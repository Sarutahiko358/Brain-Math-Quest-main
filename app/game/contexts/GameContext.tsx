"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { Player, BattleState, Scene, GameMode, Weapon, Armor, Tool, Enemy } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { DexData, EquipDexState, BattleAnimState, DojoMode, BrainOnlyStats, TownMenu, SettingsTab, BrainOnlyMode, BrainOnlyRecord, BrainEnemyAnim } from '../types';
import { AreaInfo, Tile } from '../../lib/world/areas';
import { QuizBundle, QuizType } from '../../lib/quiz/types';

/**
 * Game State Context
 *
 * Contains all read-only game state that components need to access.
 * Separated from actions to optimize re-renders.
 */
export interface GameState {
  // Core game state
  scene: Scene;
  gameMode: GameMode;
  player: Player;
  battle: BattleState | null;
  battleAnim: BattleAnimState | null;
  enemyImageError: boolean;
  battlePanelBgStyle: React.CSSProperties;

  // Map and area
  currentMap: Tile[][];
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
  dexStory: DexData;
  dexEndless: DexData;
  equipDex: EquipDexState;
  areaBannerState: { state: 'target' | 'cleared' | 'bossRoom'; bossName: string };

  // Settings and UI
  settings: Settings;
  quizCombo: number;
  topStatusExpanded: boolean;
  padObscuredComputed: boolean;
  padHasDragged: boolean;
  dojoMode: DojoMode | null;
  playTime: number;
  // Library Dojo override: 選択中の出題タイプ（エリア内で有効）
  quizTypesOverride: QuizType[] | null;

  // UI overlays state
  showMenu: boolean;
  showTown: TownMenu | null;
  showDex: boolean;
  showEquipDex: boolean;
  showDojo: boolean;
  showTeacher: boolean;
  showFieldHealList: boolean;
  showFieldItemList: boolean;
  showSettings: boolean;
  showHowto: boolean;
  showStageSelect: boolean;
  showSaveMenu: boolean;
  showStory: string | null;
  settingsTab: SettingsTab;

  // Brain-only mode
  brainEnemy: Enemy | null;
  brainEnemyAnim: BrainEnemyAnim | null;
  brainOnlyStats: BrainOnlyStats;
  brainOnlyQuiz: QuizBundle | null;
  brainOnlyMode: BrainOnlyMode;
  brainOnlyTarget: number;
  brainOnlyRecords: BrainOnlyRecord[];
  brainOnlyDraft: Settings['brainOnly'] | null;
  showBrainOnlySetup: boolean;
  showBrainOnlyConfig: boolean;
  showBrainOnlyResult: boolean;

  // Toasts
  toasts: string[];
}

/**
 * Game Actions Context
 *
 * Contains all action handlers and state setters.
 * Separated from state to optimize re-renders.
 */
export interface GameActions {
  // Core actions
  setScene: (scene: Scene) => void;
  setGameMode: (mode: GameMode) => void;
  setPlayer: (updater: Player | ((p: Player) => Player)) => void;
  setBattle: (battle: BattleState | null | ((prev: BattleState | null) => BattleState | null)) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setEnemyImageError: (error: boolean) => void;
  setQuizCombo: (combo: number) => void;
  setSettings: (updater: Settings | ((prev: Settings) => Settings)) => void;
  setDexStory: (dex: DexData) => void;
  setDexEndless: (dex: DexData) => void;
  setEquipDex: (dex: EquipDexState | ((prev: EquipDexState) => EquipDexState)) => void;
  setPlayTime: (time: number) => void;

  // UI actions
  setShowMenu: (show: boolean) => void;
  setShowTown: (menu: TownMenu | null | ((prev: TownMenu | null) => TownMenu | null)) => void;
  setShowDex: (show: boolean) => void;
  setShowEquipDex: (show: boolean) => void;
  setShowDojo: (show: boolean) => void;
  setShowTeacher: (show: boolean) => void;
  setShowFieldHealList: (show: boolean) => void;
  setShowFieldItemList: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowHowto: (show: boolean) => void;
  setShowStageSelect: (show: boolean) => void;
  setShowSaveMenu: (show: boolean) => void;
  setShowStory: (story: string | null) => void;
  setTopStatusExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  setPadHasDragged: (value: boolean) => void;
  setDojoMode: (mode: DojoMode | null) => void;
  setSettingsTab: (tab: SettingsTab | ((prev: SettingsTab) => SettingsTab)) => void;
  // Library Dojo override setter
  setQuizTypesOverride: (list: QuizType[] | null) => void;

  // Brain-only actions
  setBrainEnemy: (enemy: Enemy | null) => void;
  setBrainEnemyAnim: (anim: BrainEnemyAnim | null | ((prev: BrainEnemyAnim | null) => BrainEnemyAnim | null)) => void;
  setBrainOnlyQuiz: (quiz: QuizBundle | ((prev: QuizBundle | null) => QuizBundle | null) | null) => void;
  setBrainOnlyStats: (stats: BrainOnlyStats | ((prev: BrainOnlyStats) => BrainOnlyStats)) => void;
  setBrainOnlyRecords: (records: BrainOnlyRecord[] | ((prev: BrainOnlyRecord[]) => BrainOnlyRecord[])) => void;
  setBrainOnlyDraft: (draft: Settings['brainOnly'] | null | ((prev: Settings['brainOnly'] | null) => Settings['brainOnly'] | null)) => void;
  setBrainOnlyMode: (mode: BrainOnlyMode) => void;
  setBrainOnlyTarget: (target: number) => void;
  setShowBrainOnlySetup: (show: boolean) => void;
  setShowBrainOnlyConfig: (show: boolean) => void;
  setShowBrainOnlyResult: (show: boolean) => void;

  // Game handlers
  addToast: (message: string) => void;
  tryMove: (dr: number, dc: number) => void;
  resetAll: (areaId?: number, mode?: GameMode) => void;
  showConfirm: (message: string) => Promise<boolean>;
  doAttack: () => void;
  doRun: () => void;
  activateSkillOrMagic: (s: { key: string; name: string; rank: number; mp?: number; type: 'skill' | 'fire' | 'heal'; power: number }) => void;
  handleUseItem: (idx: number) => void;
  handleQuizResultLocal: (ok: boolean, pack: "attack" | "fire" | "heal" | "run", power: number) => void;
  advanceLog: () => void;
  onLogClick: () => void;
  doLoad: () => boolean;
  startEncounter: (tile: Tile) => void;
  handleBrainOnlyResultLocal: (ok: boolean, quiz: QuizBundle) => void;
  startBrainOnlyQuiz: () => void;

  // Field actions
  castFieldHealLocal: (mpCost: number, ratio: number, label: string, requiredKey?: string, fullHeal?: boolean) => void;
  handleUseItemField: (idx: number) => void;

  // Shop actions
  buyWeaponLocal: (w: Weapon) => void;
  buyArmorLocal: (a: Armor) => void;
  buyToolLocal: (t: Tool) => void;
  restAtInnLocal: () => void;

  // Stage and save actions
  changeStage: (areaId: number) => void;
  changeFloor: (floor: number) => void;
  doSaveToSlot: (slot: number) => void;
  doLoadFromSlot: (slot: number) => void;
  doDeleteSlot: (slot: number) => void;
  doExport: () => void;
  doImport: (file: File) => void;
}

// Create contexts with undefined default (will throw error if used outside provider)
export const GameStateContext = createContext<GameState | undefined>(undefined);
export const GameActionsContext = createContext<GameActions | undefined>(undefined);

/**
 * Hook to access game state
 * @throws Error if used outside GameProvider
 */
export function useGameState(): GameState {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within GameProvider');
  }
  return context;
}

/**
 * Hook to access game actions
 * @throws Error if used outside GameProvider
 */
export function useGameActions(): GameActions {
  const context = useContext(GameActionsContext);
  if (context === undefined) {
    throw new Error('useGameActions must be used within GameProvider');
  }
  return context;
}

/**
 * Game Provider Component
 *
 * Wraps the game component tree and provides state and actions via context.
 * This eliminates prop drilling by making state and actions available to all descendants.
 */
interface GameProviderProps {
  state: GameState;
  actions: GameActions;
  children: ReactNode;
}

export function GameProvider({ state, actions, children }: GameProviderProps) {
  return (
    <GameStateContext.Provider value={state}>
      <GameActionsContext.Provider value={actions}>
        {children}
      </GameActionsContext.Provider>
    </GameStateContext.Provider>
  );
}
