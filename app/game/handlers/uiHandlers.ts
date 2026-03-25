// ─── uiHandlers.ts ───────────────────────────────────────
// Consolidation of: handleConfirmDialog, handleVibration
// Phase 1: file merge only – no logic changes
// ──────────────────────────────────────────────────────────

import { ConfirmDialogState } from '../types';

// ─── handleConfirmDialog ──────────────────────────────────

export interface ConfirmDialogDeps {
  setConfirmDialog: (state: ConfirmDialogState) => void;
}

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

// ─── handleVibration ──────────────────────────────────────

export function handleVibration(ms: number): void {
  if (typeof navigator !== "undefined" && 'vibrate' in navigator) {
    const vibrate = (navigator as { vibrate?: (pattern: number | number[]) => boolean }).vibrate;
    if (vibrate) {
      vibrate.call(navigator, ms);
    }
  }
}
