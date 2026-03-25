import React from 'react';
import { Settings } from '../../lib/settings';
import BasicRpgSettingsSection from './settings/BasicRpgSettingsSection';
import UiScalerSettingsSection from './settings/UiScalerSettingsSection';
import PadSettingsSection from './settings/PadSettingsSection';
import StatusOverlaySettingsSection from './settings/StatusOverlaySettingsSection';

interface RpgSettingsTabProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
}

export default function RpgSettingsTab({
  settings,
  setSettings,
}: RpgSettingsTabProps) {
  return (
    <div className="form">
      <BasicRpgSettingsSection settings={settings} setSettings={setSettings} />
      <hr />
      <UiScalerSettingsSection settings={settings} setSettings={setSettings} />
      <hr />
      <PadSettingsSection settings={settings} setSettings={setSettings} />
      <hr />
      <StatusOverlaySettingsSection settings={settings} setSettings={setSettings} />
    </div>
  );
}
