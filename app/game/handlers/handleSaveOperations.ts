/**
 * Save Operations Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles save operations.
 * Original location: DQBrain.tsx lines ~861-905
 */

import { Player, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { DexData, EquipDexState } from '../types';
import { createSaveData, saveToSlot, findBestSaveSlot } from '../../lib/saveSystem';
import { UI_TIMINGS } from '../../lib/ui/constants';
import { TimerManager } from '../../lib/timerManager';

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

  // S10 Step 4: Save/load delegation - using extracted helpers
  // createSaveData and saveToSlot are already from saveSystem
  // UI feedback (toast, popup) remains in DQBrain
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

  // 手動セーブのみ: 空きスロット優先、なければ最も古いスロットを上書き
  const targetSlot = findBestSaveSlot();
  const success = saveToSlot(targetSlot, saveData);

  if (success) {
    addToast(`💾 スロット${targetSlot}にセーブしました`);
    // Show centered save confirmation
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
    // Show centered save confirmation
    setSavePopup({ visible: true });
    timerManager.setTimeout(() => setSavePopup({ visible: false }), UI_TIMINGS.SAVE_POPUP_DURATION);
  } else {
    addToast("❌ セーブに失敗しました（容量不足の可能性）");
  }
  setShowSaveMenu(false);
}
