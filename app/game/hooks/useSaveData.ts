import { useEffect } from 'react';
import { Player, GameMode } from '../../lib/gameTypes';
import { Settings, mergeSettings } from '../../lib/settings';
import { loadSave } from '../../lib/saveSystem';
import { DexData, EquipDexState } from '../types';

interface UseSaveDataParams {
  setPlayer: (player: Player) => void;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  setDexStory: (dex: DexData) => void;
  setDexEndless: (dex: DexData) => void;
  setEquipDex: (dex: EquipDexState) => void;
  setGameMode: (mode: GameMode) => void;
  setQuizCombo: (combo: number) => void;
}

/**
 * Apply backward compatibility defaults to player data
 */
function loadPlayerWithDefaults(player: Player): Player {
  return {
    ...player,
    currentArea: player.currentArea || 1,
    clearedAreas: player.clearedAreas || [],
    storyShownAreas: player.storyShownAreas || []
  };
}

/**
 * Load and reshape dex data from save file
 * Handles both old format (single object) and new format (story/endless/equip)
 */
function loadDexData(rawDex: unknown): {
  story: DexData;
  endless: DexData;
  equip: EquipDexState;
} {
  // New format with story/endless/equip structure
  if (rawDex && typeof rawDex === 'object' && ('story' in rawDex || 'endless' in rawDex)) {
    const dexObj = rawDex as {
      story?: DexData;
      endless?: DexData;
      equip?: { weapons: string[]; armors: string[] };
    };
    return {
      story: dexObj.story || {},
      endless: dexObj.endless || {},
      equip: dexObj.equip || { weapons: [], armors: [] }
    };
  }

  // Old format: treat entire object as story dex
  return {
    story: typeof rawDex === 'object' && rawDex !== null ? rawDex as DexData : {},
    endless: {},
    equip: { weapons: [], armors: [] }
  };
}

/**
 * Detect game mode with backward compatibility
 * Old saves with currentArea=10 are treated as endless mode
 */
function detectGameMode(
  savedMode: GameMode | undefined,
  currentArea: number
): GameMode {
  if (savedMode === 'endless') return 'endless';
  if (currentArea === 10) return 'endless';
  return 'story';
}

/**
 * Merge live settings from localStorage
 */
function mergeLiveSettings(
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void
): void {
  try {
    const liveStr = localStorage.getItem('dq_live_settings_v2');
    if (!liveStr) return;

    const live = JSON.parse(liveStr);
    setSettings(prev => mergeSettings({ ...prev, ...live }));
  } catch (error) {
    console.error('Failed to load live settings:', error);
  }
}

/**
 * Loads save data and live settings on mount
 *
 * Handles:
 * - Save data restoration with backward compatibility
 * - Player data migration (currentArea, clearedAreas, storyShownAreas)
 * - Settings restoration with mergeSettings
 * - Dex data reshaping (story/endless/equip structure)
 * - Game mode detection with backward compatibility
 * - Live settings merge from localStorage
 */
export function useSaveData({
  setPlayer,
  setSettings,
  setDexStory,
  setDexEndless,
  setEquipDex,
  setGameMode,
  setQuizCombo,
}: UseSaveDataParams): void {
  useEffect(() => {
    const s = loadSave();
    if (s) {
      // Load player with backward compatibility defaults
      const loadedPlayer = loadPlayerWithDefaults(s.player);
      setPlayer(loadedPlayer);

      // Restore settings safely
      setSettings(mergeSettings(s.settings));

      // Load and reshape dex data
      const dexData = loadDexData(s.dex);
      setDexStory(dexData.story);
      setDexEndless(dexData.endless);
      setEquipDex(dexData.equip);

      // Detect game mode with backward compatibility
      const loadedMode = detectGameMode(s.mode, s.player.currentArea);
      setGameMode(loadedMode);
      setQuizCombo(s.combo ?? 0);
    }

    // Merge live settings from localStorage
    mergeLiveSettings(setSettings);
  }, [setPlayer, setSettings, setDexStory, setDexEndless, setEquipDex, setGameMode, setQuizCombo]);
}
