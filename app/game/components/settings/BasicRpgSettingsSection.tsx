import React from 'react';
import { Settings } from '../../../lib/settings';
import { Player } from '../../../lib/gameTypes';

interface BasicRpgSettingsSectionProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

export default function BasicRpgSettingsSection({
  settings,
  setSettings,
}: BasicRpgSettingsSectionProps) {
  return (
    <>
      <h4>🎮 RPG設定</h4>
      <label>
        UIスケール：{settings.tileSize}px
        <input
          type="range"
          min={20}
          max={64}
          step={1}
          value={settings.tileSize}
          onChange={(e) => setSettings(s => ({ ...s, tileSize: Number(e.target.value) }))}
        />
        <small>マップやUIの大きさを調整します</small>
      </label>
      <label>
        エンカウント率：{settings.encounterRate}%
        <input
          type="range"
          min={0}
          max={40}
          value={settings.encounterRate}
          onChange={(e) => setSettings(s => ({ ...s, encounterRate: Number(e.target.value) }))}
        />
        <small>敵との遭遇頻度（0%で遭遇なし）</small>
      </label>
      <label>
        アバター：
        <select
          value={settings.avatar}
          onChange={(e) => {
            const v = e.target.value as Player["avatar"];
            setSettings(s => ({ ...s, avatar: v }));
          }}
        >
          <option value="🦸‍♀️">🦸‍♀️ 勇者（女）</option>
          <option value="🦸‍♂️">🦸‍♂️ 勇者（男）</option>
          <option value="🧙‍♀️">🧙‍♀️ 魔法使い（女）</option>
          <option value="🧙‍♂️">🧙‍♂️ 魔法使い（男）</option>
          <option value="🧝‍♀️">🧝‍♀️ エルフ（女）</option>
          <option value="🧝‍♂️">🧝‍♂️ エルフ（男）</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.soundEffects.enabled}
          onChange={(e) => setSettings(s => ({
            ...s,
            soundEffects: { ...s.soundEffects, enabled: e.target.checked }
          }))}
        />
        🔊 効果音を再生する
      </label>
      {settings.soundEffects.enabled && (
        <label>
          効果音の音量：{Math.round(settings.soundEffects.volume * 100)}%
          <input
            type="range"
            min={0}
            max={100}
            value={settings.soundEffects.volume * 100}
            onChange={(e) => setSettings(s => ({
              ...s,
              soundEffects: { ...s.soundEffects, volume: Number(e.target.value) / 100 }
            }))}
          />
          <small>効果音の音量を調整します（0-100%）</small>
        </label>
      )}
    </>
  );
}
