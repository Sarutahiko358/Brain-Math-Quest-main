/**
 * Handle confirm dialog operations
 * 
 * Handler for showing confirmation dialogs with promise-based responses.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

import { ConfirmDialogState } from '../types';

export interface ConfirmDialogDeps {
  setConfirmDialog: (state: ConfirmDialogState) => void;
}

/**
 * Show a confirmation dialog and return a promise that resolves with user's choice
 * 
 * @param message - Message to display in the dialog
 * @param deps - Dependencies for dialog state management
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export function handleConfirmDialog(
  message: string,
  deps: ConfirmDialogDeps
): Promise<boolean> {
  const { setConfirmDialog } = deps;
  
  return new Promise((resolve) => {
    setConfirmDialog({
      visible: true,
      message,
      onConfirm: () => {
        setConfirmDialog({ visible: false, message: "" });
        resolve(true);
      },
      onCancel: () => {
        setConfirmDialog({ visible: false, message: "" });
        resolve(false);
      }
    });
  });
}
