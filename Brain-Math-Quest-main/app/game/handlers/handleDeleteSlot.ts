/**
 * Handle save slot deletion
 * 
 * Handler for deleting a save slot and showing toast feedback.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

import { deleteSaveSlot } from '../../lib/saveSystem';

export interface DeleteSlotDeps {
  addToast: (message: string) => void;
}

/**
 * Delete a save slot and show feedback toast
 * 
 * @param slot - Slot number to delete
 * @param deps - Dependencies for toast notifications
 */
export function handleDeleteSlot(slot: number, deps: DeleteSlotDeps): void {
  const { addToast } = deps;
  
  if (deleteSaveSlot(slot)) {
    addToast(`🗑️ スロット${slot}を削除しました`);
  }
}
