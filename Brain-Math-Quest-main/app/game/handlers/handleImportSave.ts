/**
 * Handle save data import
 * 
 * Handler for importing game save data from a file.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

import { importSaveData } from '../../lib/saveSystem';
import { LoadOperationsDeps, applyLoadedSave } from './handleLoadOperations';

export interface ImportSaveDeps extends LoadOperationsDeps {
  addToast: (message: string) => void;
}

/**
 * Import game save data from a file
 * 
 * @param file - File object containing save data
 * @param deps - Dependencies containing state setters and toast handler
 */
export function handleImportSave(file: File, deps: ImportSaveDeps): void {
  const { addToast } = deps;
  
  importSaveData(file, (data) => {
    if (!data) {
      addToast("❌ インポートに失敗しました");
      return;
    }
    
    // Apply loaded data using extracted helper
    applyLoadedSave(data, deps);
    addToast("📤 セーブデータをインポートしました");
  });
}
