/**
 * Handle save data export
 * 
 * Handler for exporting game save data to a file.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

import { Player, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { DexData, EquipDexState } from '../types';
import { createSaveData, exportSaveData } from '../../lib/saveSystem';

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

/**
 * Export current game save data to a file
 * 
 * @param deps - Dependencies containing game state and toast handler
 */
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
