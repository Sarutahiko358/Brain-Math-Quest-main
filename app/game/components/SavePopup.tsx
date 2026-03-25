import React from 'react';
import { UI_COLORS } from '../../lib/ui/constants';

interface SavePopupProps {
  visible: boolean;
}

/**
 * セーブ確認ポップアップ（中央・自動クローズ）
 */
export default function SavePopup({ visible }: SavePopupProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          background: UI_COLORS.DARK_BLUE_BG_RGBA,
          color: UI_COLORS.LIGHT_BLUE_TEXT,
          border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
          borderRadius: 12,
          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          padding: '16px 32px',
          fontSize: 18,
          fontWeight: 700,
          textAlign: 'center'
        }}
      >
        💾 セーブしました
      </div>
    </div>
  );
}
