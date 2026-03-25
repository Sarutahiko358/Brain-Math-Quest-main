import React from 'react';
import { Settings } from '../../../lib/settings';

interface UiScalerSettingsSectionProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

const HELP_TEXT_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '0.85em',
  opacity: 0.7,
};

export default function UiScalerSettingsSection({
  settings,
  setSettings,
}: UiScalerSettingsSectionProps) {
  return (
    <>
      <h4>UIスケーラー設定</h4>
      <label className="row">
        UIスケーラーを表示：
        <input
          type="checkbox"
          checked={settings.uiScale.show}
          onChange={(e) => setSettings(s => ({ ...s, uiScale: { ...s.uiScale, show: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>ヘッダー下のUIスケーラーの表示/非表示を切り替えます</small>
      </label>
      <label className="row">
        全画面に適用：
        <input
          type="checkbox"
          checked={settings.uiScale.applyToAll}
          onChange={(e) => setSettings(s => ({ ...s, uiScale: { ...s.uiScale, applyToAll: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>OFFの場合、戦闘中・脳トレのみモードでは非表示になります</small>
      </label>
    </>
  );
}
