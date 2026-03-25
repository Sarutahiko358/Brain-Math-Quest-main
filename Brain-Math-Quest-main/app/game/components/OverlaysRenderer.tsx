import React from 'react';
import MenuOverlay from '../overlays/MenuOverlay';
import BrainOnlyResultOverlay from '../overlays/BrainOnlyResultOverlay';
import FieldHealListOverlay from '../overlays/FieldHealListOverlay';
import FieldItemListOverlay from '../overlays/FieldItemListOverlay';
import TownOverlay from '../overlays/TownOverlay';
import BestiaryOverlay from '../overlays/BestiaryOverlay';
import EquipDexOverlay from '../overlays/EquipDexOverlay';
import DojoOverlay from '../overlays/DojoOverlay';
import TeacherOverlay from '../overlays/TeacherOverlay';
import StageSelectOverlay from '../overlays/StageSelectOverlay';
import SettingsOverlay from '../overlays/SettingsOverlay';
import SaveMenuOverlay from '../overlays/SaveMenuOverlay';
import BrainOnlySetupOverlay from '../overlays/BrainOnlySetupOverlay';
import BrainOnlyConfigOverlay from '../overlays/BrainOnlyConfigOverlay';
import HowToOverlay from '../overlays/HowToOverlay';
import StoryOverlay from '../overlays/StoryOverlay';

/**
 * Renders all game overlays (menu, dialogs, settings, etc.)
 * Uses Context API to eliminate props drilling (reduced from 100+ props to 0)
 * All overlays now independently access state via useGameState/useGameActions hooks
 */
export default function OverlaysRenderer() {
  return (
    <>
      <MenuOverlay />
      <BrainOnlyResultOverlay />
      <FieldHealListOverlay />
      <FieldItemListOverlay />
      <TownOverlay />
      <BestiaryOverlay />
      <EquipDexOverlay />
      <DojoOverlay />
      <TeacherOverlay />
      <StageSelectOverlay />
      <SettingsOverlay />
      <SaveMenuOverlay />
      <BrainOnlySetupOverlay />
      <BrainOnlyConfigOverlay />
      <HowToOverlay />
      <StoryOverlay />
    </>
  );
}
