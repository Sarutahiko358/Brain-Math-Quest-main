import React from 'react';
import Overlay from '../../components/Overlay';
import RpgSettingsTab from '../components/RpgSettingsTab';
import BrainSettingsTab from '../components/BrainSettingsTab';
import { useGameState, useGameActions } from '../contexts/GameContext';

/**
 * SettingsOverlay
 *
 * Comprehensive settings panel with RPG and Brain training configuration.
 * Includes UI scaling, D-pad controls, difficulty settings, and quiz type selection.
 */

export default function SettingsOverlay() {
  // Get state and actions from Context
  const { showSettings, settings, settingsTab, scene } = useGameState();
  const { setShowSettings, setSettings, setSettingsTab } = useGameActions();

  if (!showSettings) return null;

  return (
    <Overlay title="設定" onClose={() => setShowSettings(false)}>
      <div className="settingsTabs">
        <button
          className={settingsTab === "rpg" ? "tabBtn active" : "tabBtn"}
          onClick={() => setSettingsTab("rpg")}
        >
          🎮 RPG設定
        </button>
        <button
          className={settingsTab === "brain" ? "tabBtn active" : "tabBtn"}
          onClick={() => setSettingsTab("brain")}
        >
          🧠 脳トレ設定
        </button>
      </div>

      {settingsTab === "rpg" && (
        <RpgSettingsTab settings={settings} setSettings={setSettings} />
      )}

      {settingsTab === "brain" && (
        <BrainSettingsTab settings={settings} setSettings={setSettings} scene={scene} />
      )}
    </Overlay>
  );
}
