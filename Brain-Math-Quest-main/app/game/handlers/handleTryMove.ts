/**
 * Movement Handler
 *
 * Mechanically extracted from DQBrain.tsx - handles player movement and encounters.
 * Original location: DQBrain.tsx lines 656-847
 */

import { Player, BattleState, Scene, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { validateMovement } from '../../lib/world/movementAdapter';
import { isAtPosition } from '../../lib/world/movement';
import { AreaInfo, Tile } from '../../lib/world/areas';
import { DexData, TownMenu } from '../types';
import { TimerManager } from '../../lib/timerManager';
import { checkGuardianEncounter } from './movement/guardianEncounter';
import { checkBossEncounter } from './movement/bossEncounter';

export interface TryMoveDeps {
  timerManager: TimerManager;
  scene: Scene;
  player: Player;
  gameMode: GameMode;
  settings: Settings;
  currentMap: Tile[][];
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
  showTown: TownMenu | null;
  showMenu: boolean;
  showDex: boolean;
  showDojo: boolean;
  showSettings: boolean;
  showHowto: boolean;
  showStageSelect: boolean;
  showSaveMenu: boolean;
  showStory: string | null;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: Scene) => void;
  setShowStory: (story: string | null) => void;
  setShowTown: (menu: TownMenu | null) => void;
  setShowDojo: (show: boolean) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
  startEncounter: (tile: Tile) => void;
  equipAccessory: (name: string) => void;
}

export function handleTryMove(dr: number, dc: number, deps: TryMoveDeps) {
  const {
    timerManager,
    scene,
    player,
    gameMode,
    settings,
    currentMap,
    currentAreaInfo,
    currentDex,
    showTown,
    showMenu,
    showDex,
    showDojo,
    showSettings,
    showHowto,
    showStageSelect,
    showSaveMenu,
    showStory,
    setPlayer,
    setBattle,
    setScene,
    setShowStory,
    setShowTown,
    setShowDojo,
    addToast,
    recordSeen,
    startEncounter,
    equipAccessory
  } = deps;

  // S10 Step1: Movement adapter layer integration (COMPLETED)
  //
  // CHANGES:
  // - Basic movement validation now uses validateMovement adapter
  // - Delegates to shared helpers (calculateNewPosition, isWalkable, shouldTriggerEncounter, getSpecialLocationType)
  // - Reduces duplication while maintaining exact behavior
  // - DQBrain-specific logic (guardians, bosses, endless mode) remains here
  //
  // INTEGRATION APPROACH:
  // - validateMovement provides pure validation (no side effects)
  // - Returns newPos, tile, specialLocation, shouldEncounter in single call
  // - DQBrain continues to handle complex game modes (endless, boss rush, guardians)
  // - Future: Could extend useGameState to handle more DQBrain-specific scenarios

  // フィールド以外のシーンでは移動を無効化（戦闘中に移動して敵が変わるのを防止）
  if (scene !== "map") {
    return;
  }
  // オーバーレイ表示中は移動させない（町メニュー等が即閉じ/即離脱するのを防止）
  const isAnyOverlayOpen = () => !!(showTown || showMenu || showDex || showDojo || showSettings || showHowto || showStageSelect || showSaveMenu || showStory);
  if (isAnyOverlayOpen()) {
    return;
  }

  // Movement logic - now uses validateMovement adapter (S10 Step1)
  const validation = validateMovement(player.pos, dr, dc, currentMap, settings.encounterRate);

  if (!validation.allowed) {
    return; // Cannot move to this tile
  }

  setPlayer(p => {
    const { newPos, tile, specialLocation, shouldEncounter } = validation;
    const nr = newPos.r;
    const nc = newPos.c;
    const moved: Player = { ...p, pos: { r: nr, c: nc } };

    // Check for guardian encounters in Area 7
    const guardianEncountered = checkGuardianEncounter(p, newPos, {
      timerManager,
      settings,
      setPlayer,
      setBattle,
      setScene,
      setShowStory,
      addToast,
      recordSeen,
      equipAccessory
    });
    if (guardianEncountered) return moved;

    // Check for boss encounters
    const bossEncounterResult = checkBossEncounter(p, newPos, {
      timerManager,
      gameMode,
      settings,
      currentAreaInfo,
      currentDex,
      setBattle,
      setScene,
      setShowStory,
      setPlayer,
      addToast,
      recordSeen
    });
    if (bossEncounterResult.shouldStopMoving) {
      return moved;
    }

    // Check for dojo
    if (currentAreaInfo.dojoPos && isAtPosition({ r: nr, c: nc }, currentAreaInfo.dojoPos)) {
      setShowDojo(true);
      return moved;
    }

    // Check for special locations (town/castle) and encounters
    if (specialLocation === 'town' || specialLocation === 'castle') {
      setShowTown("menu");
    } else if (shouldEncounter) {
      startEncounter(tile);
    }
    return moved;
  });
}
