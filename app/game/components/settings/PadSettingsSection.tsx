import React from 'react';
import { Settings } from '../../../lib/settings';

interface PadSettingsSectionProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

const HELP_TEXT_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '0.85em',
  opacity: 0.7,
};

export default function PadSettingsSection({
  settings,
  setSettings,
}: PadSettingsSectionProps) {
  return (
    <>
      <h4>コントローラー（Dパッド）</h4>
      <label className="row">
        表示：
        <input
          type="checkbox"
          checked={settings.pad.show}
          onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, show: e.target.checked } }))}
        />
      </label>
      <label className="row">
        ドラッグ移動を有効化：
        <input
          type="checkbox"
          checked={!!settings.pad.floating}
          onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, floating: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>Dパッドを指/マウスで掴んで自由に配置できます（OFFで画面端に固定）</small>
      </label>
      <label className="row">
        折りたたみ：
        <input
          type="checkbox"
          checked={!!settings.pad.collapsed}
          onChange={(e) => setSettings(s => ({ ...s, pad: { ...s.pad, collapsed: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>Dパッドをコンパクト表示にします（誤タップ防止・視界確保向け）</small>
      </label>
      <label>
        サイズ：{settings.pad.sizePct}%
        <input
          type="range"
          min={40}
          max={200}
          step={5}
          value={settings.pad.sizePct}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSettings((s) => ({ ...s, pad: { ...s.pad, sizePct: v, size: Math.round(56 * v / 100) } }));
          }}
        />
      </label>
      <label>
        不透明度：{Math.round(settings.pad.opacity * 100)}%
        <input
          type="range"
          min={50}
          max={100}
          step={5}
          value={Math.round(settings.pad.opacity * 100)}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              pad: { ...s.pad, opacity: Number(e.target.value) / 100 },
            }))
          }
        />
      </label>
    </>
  );
}
