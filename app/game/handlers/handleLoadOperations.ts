/**
 * Load Operations Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles load operations.
 * Original location: DQBrain.tsx lines ~908-943
 */

import { Player, Scene, GameMode } from '../../lib/gameTypes';
import { Settings, mergeSettings } from '../../lib/settings';
import { DexData, EquipDexState } from '../types';
import { SaveData, loadSave, loadFromSlot, extractPlayerFromSave, extractDexFromSave, extractGameModeFromSave } from '../../lib/saveSystem';

export interface LoadOperationsDeps {
  setPlayer: (player: Player) => void;
  setSettings: (settings: Settings) => void;
  setDexStory: (dex: DexData) => void;
  setDexEndless: (dex: DexData) => void;
  setEquipDex: (equipDex: EquipDexState) => void;
  setGameMode: (mode: GameMode) => void;
  setQuizCombo: (combo: number) => void;
  setPlayTime: (time: number) => void;
  setScene: (scene: Scene) => void;
  addToast: (msg: string) => void;
  setShowSaveMenu: (show: boolean) => void;
}

// S10 Step 4: Extract common load logic to reduce duplication
export function applyLoadedSave(s: SaveData, deps: LoadOperationsDeps) {
  const { setPlayer, setSettings, setDexStory, setDexEndless, setEquipDex, setGameMode, setQuizCombo, setPlayTime } = deps;
  
  setPlayer(extractPlayerFromSave(s));
  setSettings(mergeSettings(s.settings));
  
  const dex = extractDexFromSave(s);
  setDexStory(dex.story);
  setDexEndless(dex.endless);
  setEquipDex(dex.equip);
  
  setGameMode(extractGameModeFromSave(s));
  setQuizCombo(s.combo ?? 0);
  setPlayTime(s.meta?.playTime || 0);
}

export function handleDoLoad(deps: LoadOperationsDeps): boolean {
  const { setScene, addToast } = deps;
  
  // S10 Step 4: Load delegation - extracted common logic to applyLoadedSave
  const s = loadSave();
  if (!s) { 
    addToast("セーブが見つかりません"); 
    return false; 
  }
  
  applyLoadedSave(s, deps);
  setScene("map");
  addToast("📂 ロードしました");
  return true;
}

export function handleDoLoadFromSlot(slot: number, deps: LoadOperationsDeps) {
  const { addToast, setShowSaveMenu, setScene } = deps;

  const s = loadFromSlot(slot);
  if (!s) { addToast(`スロット${slot}にデータがありません`); return; }

  applyLoadedSave(s, deps);
  setScene("map");
  addToast(`📂 スロット${slot}からロードしました`);
  setShowSaveMenu(false);
}
