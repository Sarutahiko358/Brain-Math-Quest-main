import React from 'react';
import { UI_COLORS } from '../../lib/ui/constants';
import { LevelUpDialogState } from '../types';

interface LevelUpDialogProps {
  levelUpDialog: LevelUpDialogState;
  onClose: () => void;
}

/**
 * レベルアップ詳細ダイアログ（中央・手動クローズ）
 */
export default function LevelUpDialog({ levelUpDialog, onClose }: LevelUpDialogProps) {
  if (!levelUpDialog.visible) return null;

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
    >
      <div
        style={{
          minWidth: 320,
          maxWidth: 520,
          background: UI_COLORS.DARK_BLUE_BG_RGBA,
          color: UI_COLORS.LIGHT_BLUE_TEXT,
          border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
          borderRadius: 14,
          boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
          padding: 18
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
          🎉 レベルアップ
        </div>
        {levelUpDialog.info && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              Lv {levelUpDialog.info.oldLv} → <strong>Lv {levelUpDialog.info.newLv}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14 }}>
              <span>HP +{levelUpDialog.info.hpGain}</span>
              <span>MP +{levelUpDialog.info.mpGain}</span>
              <span>ATK +{levelUpDialog.info.atkGain}</span>
              <span>DEF +{levelUpDialog.info.defGain}</span>
            </div>
          </>
        )}
        {levelUpDialog.details && levelUpDialog.details.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(10,16,40,0.6)', borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}>
            {levelUpDialog.details.map((d, i) => (
              <div key={i}>・Lv{d.fromLv} → Lv{d.toLv}：HP +{d.hp} / MP +{d.mp} / ATK +{d.atk} / DEF +{d.def}</div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button onClick={onClose} aria-label="レベルアップ情報を確認">確認</button>
        </div>
      </div>
    </div>
  );
}
