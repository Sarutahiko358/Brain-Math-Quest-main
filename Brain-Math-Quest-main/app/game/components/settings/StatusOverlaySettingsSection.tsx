import React from 'react';
import { Settings } from '../../../lib/settings';

interface StatusOverlaySettingsSectionProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

export default function StatusOverlaySettingsSection({
  settings,
  setSettings,
}: StatusOverlaySettingsSectionProps) {
  return (
    <>
      <h4>ステータス表示</h4>
      <label className="row">
        画面表示：
        <input
          type="checkbox"
          checked={settings.statusOverlay.show}
          onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, show: e.target.checked } }))}
        />
      </label>
      <label>
        サイズ：{settings.statusOverlay.size}%
        <input
          type="range"
          min={50}
          max={150}
          step={5}
          value={settings.statusOverlay.size}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSettings((s) => ({ ...s, statusOverlay: { ...s.statusOverlay, size: v } }));
          }}
        />
      </label>
      <label>
        不透明度：{Math.round(settings.statusOverlay.opacity * 100)}%
        <input
          type="range"
          min={40}
          max={100}
          step={5}
          value={Math.round(settings.statusOverlay.opacity * 100)}
          onChange={(e) => setSettings(s => ({ ...s, statusOverlay: { ...s.statusOverlay, opacity: Number(e.target.value) / 100 } }))}
        />
      </label>
    </>
  );
}
