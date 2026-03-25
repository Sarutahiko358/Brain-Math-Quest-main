// ─── saveHandlers.ts ─────────────────────────────────────
// Consolidation of: handleSaveOperations, handleLoadOperations,
//   handleDeleteSlot, handleExportSave, handleImportSave
// Phase 1: file merge only – no logic changes
// ──────────────────────────────────────────────────────────

import { Player, Scene, GameMode } from '../../lib/gameTypes';
import { Settings, mergeSettings } from '../../lib/settings';
import { DexData, EquipDexState } from '../types';
import {
  createSaveData,
  saveToSlot,
  findBestSaveSlot,
  SaveData,
  loadSave,
  loadFromSlot,
  extractPlayerFromSave,
  extractDexFromSave,
  extractGameModeFromSave,
  deleteSaveSlot,
  exportSaveData,
  importSaveData,
} from '../../lib/saveSystem';
import { UI_TIMINGS } from '../../lib/ui/constants';
import { TimerManager } from '../../lib/timerManager';

// ─── handleSaveOperations ─────────────────────────────────

export interface SaveOperationsDeps {
  timerManager: TimerManager;
  player: Player;
  settings: Settings;
  dexStory: DexData;
  dexEndless: DexData;
  equipDex: EquipDexState;
  quizCombo: number;
  playTime: number;
  gameMode: GameMode;
  addToast: (msg: string) => void;
  setSavePopup: (popup: { visible: boolean }) => void;
  setShowSaveMenu: (show: boolean) => void;
}

export function handleDoSave(deps: SaveOperationsDeps) {
  const { timerManager, player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast, setSavePopup } = deps;

  const saveData = createSaveData({
    player,
    settings,
    dexStory,
    dexEndless,
    equipDex,
    quizCombo,
    playTime,
    gameMode
  });

  const targetSlot = findBestSaveSlot();
  const success = saveToSlot(targetSlot, saveData);

  if (success) {
    addToast(`💾 スロット${targetSlot}にセーブしました`);
    setSavePopup({ visible: true });
    timerManager.setTimeout(() => setSavePopup({ visible: false }), UI_TIMINGS.SAVE_POPUP_DURATION);
  } else {
    addToast("❌ セーブに失敗しました（容量不足の可能性）");
  }
}

export function handleDoSaveToSlot(slot: number, deps: SaveOperationsDeps) {
  const { timerManager, player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast, setSavePopup, setShowSaveMenu } = deps;

  const saveData = createSaveData({
    player,
    settings,
    dexStory,
    dexEndless,
    equipDex,
    quizCombo,
    playTime,
    gameMode
  });
  if (saveToSlot(slot, saveData)) {
    addToast(`💾 スロット${slot}にセーブしました`);
    setSavePopup({ visible: true });
    timerManager.setTimeout(() => setSavePopup({ visible: false }), UI_TIMINGS.SAVE_POPUP_DURATION);
  } else {
    addToast("❌ セーブに失敗しました（容量不足の可能性）");
  }
  setShowSaveMenu(false);
}

// ─── handleLoadOperations ─────────────────────────────────

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

// ─── handleDeleteSlot ─────────────────────────────────────

export interface DeleteSlotDeps {
  addToast: (message: string) => void;
}

export function handleDeleteSlot(slot: number, deps: DeleteSlotDeps): void {
  const { addToast } = deps;
  
  if (deleteSaveSlot(slot)) {
    addToast(`🗑️ スロット${slot}を削除しました`);
  }
}

// ─── handleExportSave ─────────────────────────────────────

export interface ExportSaveDeps {
  player: Player;
  settings: Settings;
  dexStory: DexData;
  dexEndless: DexData;
  equipDex: EquipDexState;
  quizCombo: number;
  playTime: number;
  gameMode: GameMode;
  addToast: (message: string) => void;
}

export function handleExportSave(deps: ExportSaveDeps): void {
  const {
    player,
    settings,
    dexStory,
    dexEndless,
    equipDex,
    quizCombo,
    playTime,
    gameMode,
    addToast
  } = deps;
  
  const saveData = createSaveData({
    player,
    settings,
    dexStory,
    dexEndless,
    equipDex,
    quizCombo,
    playTime,
    gameMode
  });
  exportSaveData(saveData);
  addToast("📥 セーブデータをエクスポートしました");
}

// ─── handleImportSave ─────────────────────────────────────

export interface ImportSaveDeps extends LoadOperationsDeps {
  addToast: (message: string) => void;
}

export function handleImportSave(file: File, deps: ImportSaveDeps): void {
  const { addToast } = deps;
  
  importSaveData(file, (data) => {
    if (!data) {
      addToast("❌ インポートに失敗しました");
      return;
    }
    
    applyLoadedSave(data, deps);
    addToast("📤 セーブデータをインポートしました");
  });
}
