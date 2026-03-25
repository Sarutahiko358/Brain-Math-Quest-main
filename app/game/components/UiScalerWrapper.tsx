import React from 'react';
import { Scene } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import UiScaler from '../../components/UiScaler';
import { clamp } from '../../lib/utils/math';

interface UiScalerWrapperProps {
  scene: Scene;
  settings: Settings;
  setSettings: (updater: (prev: Settings) => Settings) => void;
}

/**
 * Wrapper for UI scaler with conditional rendering logic
 * Reduces complexity in DQBrain by consolidating UI scaler display conditions
 */
export default function UiScalerWrapper({ scene, settings, setSettings }: UiScalerWrapperProps) {
  if (!settings.uiScale.show) {
    return null;
  }

  if (scene === 'title') {
    return null;
  }

  if (settings.uiScale.applyToAll) {
    // Apply to all non-title scenes
    return (
      <UiScaler
        value={settings.tileSize}
        min={16}
        max={64}
        step={1}
        onChange={(v) => setSettings(s => ({ ...s, tileSize: clamp(v, 16, 64) }))}
      />
    );
  }

  // Apply only to map scene (not battle, not brainOnly)
  if (scene !== 'battle' && scene !== 'brainOnly') {
    return (
      <UiScaler
        value={settings.tileSize}
        min={16}
        max={64}
        step={1}
        onChange={(v) => setSettings(s => ({ ...s, tileSize: clamp(v, 16, 64) }))}
      />
    );
  }

  return null;
}
