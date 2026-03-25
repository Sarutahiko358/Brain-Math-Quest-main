import React from 'react';
import { UI_COLORS } from '../../lib/ui/constants';
import { ConfirmDialogState } from '../types';

interface ConfirmDialogProps {
  confirmDialog: ConfirmDialogState;
}

/**
 * カスタム確認ダイアログ（中央表示）
 */
export default function ConfirmDialog({ confirmDialog }: ConfirmDialogProps) {
  if (!confirmDialog.visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={() => confirmDialog.onCancel?.()}
    >
      <div
        style={{
          minWidth: 320,
          maxWidth: 480,
          background: UI_COLORS.DARK_BLUE_BG_RGBA,
          color: UI_COLORS.LIGHT_BLUE_TEXT,
          border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
          borderRadius: 14,
          boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
          padding: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, lineHeight: 1.6, textAlign: 'center', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
          {confirmDialog.message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={confirmDialog.onConfirm} style={{ minWidth: 100 }} aria-label="はい、実行する">
            はい
          </button>
          <button onClick={confirmDialog.onCancel} style={{ minWidth: 100 }} aria-label="いいえ、キャンセル">
            いいえ
          </button>
        </div>
      </div>
    </div>
  );
}
