/**
 * Save System module
 * 
 * Handles all save/load operations including:
 * - Save slot management
 * - Local storage persistence
 * - Export/Import functionality
 * - Save data migration
 * 
 * CRITICAL: Do not modify SAVE_KEY_PREFIX or save format without migration path
 */

import { Player } from './gameTypes';
import { migrateSaveData } from './saveMigration';
import { Settings } from './settings';
import { DexData, EquipDexState } from '../game/types';

/* -------------------- Types -------------------- */

export type SaveData = {
  player: Player;
  settings: Settings;
  dex: DexData | { story: DexData; endless: DexData; equip: EquipDexState }; // backward compat in migration; we reshape on load to {story, endless, equip}
  combo?: number;
  meta: { saveDate: number; playTime: number; version: string };
  mode?: 'story' | 'endless' | 'library';
};

/* -------------------- Constants -------------------- */

export const SAVE_KEY_PREFIX = "dq_like_brain_v2_slot_";
export const MAX_SAVE_SLOTS = 3;
export const FIRST_RUN_LAYOUT_DEFAULTS = "dq_like_first_layout_defaults_v1";

/* -------------------- Save/Load Functions -------------------- */

/**
 * Save data to a specific slot
 * @param slot Slot number (1-3)
 * @param data Save data to persist
 * @returns true if successful, false otherwise
 */
export function saveToSlot(slot: number, data: SaveData): boolean {
  try {
    const saveData: SaveData = {
      ...data,
      meta: {
        saveDate: Date.now(),
        playTime: data.meta?.playTime || 0,
        version: "2.0"
      },
    };
    localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error(`Failed to save to slot ${slot}:`, error);
    return false;
  }
}

/**
 * Load data from a specific slot
 * @param slot Slot number (1-3)
 * @returns SaveData if found, null otherwise
 */
export function loadFromSlot(slot: number): SaveData | null {
  try {
    const s = localStorage.getItem(SAVE_KEY_PREFIX + slot);
    return s ? JSON.parse(s) : null;
  } catch (error) {
    console.error(`Failed to load from slot ${slot}:`, error);
    return null;
  }
}

/**
 * Get all save slots
 * @returns Array of SaveData or null for each slot
 */
export function getAllSaveSlots(): (SaveData | null)[] {
  const slots: (SaveData | null)[] = [];
  for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
    slots.push(loadFromSlot(i));
  }
  return slots;
}

/**
 * Delete a save slot
 * @param slot Slot number (1-3)
 * @returns true if successful, false otherwise
 */
export function deleteSaveSlot(slot: number): boolean {
  try {
    localStorage.removeItem(SAVE_KEY_PREFIX + slot);
    return true;
  } catch (error) {
    console.error(`Failed to delete save slot ${slot}:`, error);
    return false;
  }
}

/**
 * Export save data to a JSON file
 * @param data Save data to export
 */
export function exportSaveData(data: SaveData): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rpg-brain-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed:", e);
  }
}

/**
 * Import save data from a JSON file
 * @param file File to import
 * @param callback Callback with parsed data or null on error
 */
export function importSaveData(file: File, callback: (data: SaveData | null) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      callback(data);
    } catch (error) {
      console.error('Failed to import save data:', error);
      callback(null);
    }
  };
  reader.readAsText(file);
}

/**
 * Load the most recent save automatically
 * @returns SaveData if found, null otherwise
 */
export function loadSave(): SaveData | null {
  try {
    let latestSlot = 1;
    let latestTime = 0;
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const data = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (data) {
        const parsed: SaveData = JSON.parse(data);
        if (parsed.meta && parsed.meta.saveDate > latestTime) {
          latestTime = parsed.meta.saveDate;
          latestSlot = i;
        }
      }
    }
    if (latestTime > 0) {
      const s = localStorage.getItem(SAVE_KEY_PREFIX + latestSlot);
      if (!s) return null;
      const raw = JSON.parse(s);
      // マイグレーション（削除済みクイズタイプの除去など）
      const migrated = migrateSaveData(raw);
      return migrated as unknown as SaveData;
    }
  } catch (error) {
    console.error('Failed to load most recent save:', error);
  }
  return null;
}

/* -------------------- Helper Functions -------------------- */

/**
 * Create save data from current game state
 * @param gameState Current game state
 * @returns SaveData ready to be saved
 */
export function createSaveData(gameState: {
  player: Player;
  settings: Settings;
  dexStory: DexData;
  dexEndless: DexData;
  equipDex: EquipDexState;
  quizCombo: number;
  playTime: number;
  gameMode: 'story' | 'endless' | 'library';
}): SaveData {
  return {
    player: gameState.player,
    settings: gameState.settings,
    dex: {
      story: gameState.dexStory,
      endless: gameState.dexEndless,
      equip: gameState.equipDex
    },
    combo: gameState.quizCombo,
    meta: {
      saveDate: Date.now(),
      playTime: gameState.playTime,
      version: "2.0"
    },
    mode: gameState.gameMode
  };
}

/**
 * Find the best slot for auto-save
 * Prefers empty slots, then oldest slot
 * @returns Slot number (1-3)
 */
export function findBestSaveSlot(): number {
  const slots = getAllSaveSlots();
  const emptySlot = slots.findIndex(s => s === null);
  if (emptySlot >= 0) {
    return emptySlot + 1;
  }
  
  // All slots full, find oldest
  let targetSlot = 1;
  let oldestTime = Date.now();
  slots.forEach((s, idx) => {
    if (s && s.meta && s.meta.saveDate < oldestTime) {
      oldestTime = s.meta.saveDate;
      targetSlot = idx + 1;
    }
  });
  return targetSlot;
}

/**
 * Extract player data from save with backward compatibility
 * @param saveData Save data to extract from
 * @returns Player object with all required fields
 */
export function extractPlayerFromSave(saveData: SaveData): Player {
  return {
    ...saveData.player,
    currentArea: saveData.player.currentArea || 1,
    clearedAreas: saveData.player.clearedAreas || [],
    storyShownAreas: saveData.player.storyShownAreas || [],
    endlessFloor: saveData.player.endlessFloor || 1
  };
}

/**
 * Extract dex data from save with backward compatibility
 * @param saveData Save data to extract from
 * @returns Dex object with story, endless, and equip fields
 */
export function extractDexFromSave(saveData: SaveData): {
  story: DexData;
  endless: DexData;
  equip: EquipDexState;
} {
  const rawDex = saveData.dex;
  if (rawDex && typeof rawDex === 'object' && ('story' in rawDex || 'endless' in rawDex)) {
    const typedDex = rawDex as { story?: DexData; endless?: DexData; equip?: EquipDexState };
    return {
      story: typedDex.story || {},
      endless: typedDex.endless || {},
      equip: typedDex.equip || { weapons: [], armors: [] }
    };
  } else {
    return {
      story: (rawDex as DexData) || {},
      endless: {},
      equip: { weapons: [], armors: [] }
    };
  }
}

/**
 * Extract game mode from save with backward compatibility
 * @param saveData Save data to extract from
 * @returns Game mode ('story', 'endless', or 'library')
 */
export function extractGameModeFromSave(saveData: SaveData): 'story' | 'endless' | 'library' {
  // 後方互換: 古いセーブでcurrentArea=10の場合、modeがなければendlessと判定
  const mode = saveData.mode;
  if (mode === 'endless') return 'endless';
  if (mode === 'library') return 'library';
  if (saveData.player.currentArea === 10) return 'endless';
  return 'story';
}
