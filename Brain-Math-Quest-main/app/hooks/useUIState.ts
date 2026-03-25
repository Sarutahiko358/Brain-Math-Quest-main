import { useState } from 'react';
import { SettingsTab, TownMenu, DojoMode } from '../game/types';
import { AreaTrainingMode } from '../lib/dojoLibrary';

/**
 * Centralized UI state management hook
 * Consolidates 13+ visibility states into a single hook
 * Reduces DQBrain.tsx complexity and improves maintainability
 */

export interface UIState {
  // Overlay visibility
  showMenu: boolean;
  showTown: TownMenu | null;
  showDex: boolean;
  showEquipDex: boolean;
  showDojo: boolean;
  showFieldHealList: boolean;
  showFieldItemList: boolean;
  showSettings: boolean;
  showHowto: boolean;
  showStageSelect: boolean;
  showSaveMenu: boolean;

  // Status bar & D-pad
  topStatusExpanded: boolean;
  padObscured: boolean;
  padHasDragged: boolean;

  // Settings tab
  settingsTab: SettingsTab;

  // Dojo mode
  dojoMode: DojoMode | null;

  // Story display
  showStory: boolean;

  // Teacher (library mode)
  showTeacher: boolean;

  // Area training mode (library mode)
  areaTrainingMode: AreaTrainingMode | null;
}

export interface UIActions {
  setShowMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowTown: (menu: TownMenu | null | ((prev: TownMenu | null) => TownMenu | null)) => void;
  setShowDex: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowEquipDex: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowDojo: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowFieldHealList: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowFieldItemList: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowHowto: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowStageSelect: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowSaveMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  setTopStatusExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  setPadObscured: (obscured: boolean | ((prev: boolean) => boolean)) => void;
  setPadHasDragged: (dragged: boolean | ((prev: boolean) => boolean)) => void;
  setSettingsTab: (tab: SettingsTab | ((prev: SettingsTab) => SettingsTab)) => void;
  setDojoMode: (mode: DojoMode | null | ((prev: DojoMode | null) => DojoMode | null)) => void;
  setShowStory: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowTeacher: (show: boolean | ((prev: boolean) => boolean)) => void;
  setAreaTrainingMode: (mode: AreaTrainingMode | null | ((prev: AreaTrainingMode | null) => AreaTrainingMode | null)) => void;

  // Convenience methods
  closeAllOverlays: () => void;
  closeAllFieldLists: () => void;
}

export function useUIState() {
  const [showMenu, setShowMenu] = useState(false);
  const [showTown, setShowTown] = useState<TownMenu | null>(null);
  const [showDex, setShowDex] = useState(false);
  const [showEquipDex, setShowEquipDex] = useState(false);
  const [showDojo, setShowDojo] = useState(false);
  const [showFieldHealList, setShowFieldHealList] = useState(false);
  const [showFieldItemList, setShowFieldItemList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowto, setShowHowto] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [topStatusExpanded, setTopStatusExpanded] = useState(false);
  const [padObscured, setPadObscured] = useState(false);
  const [padHasDragged, setPadHasDragged] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('rpg');
  const [dojoMode, setDojoMode] = useState<DojoMode | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [areaTrainingMode, setAreaTrainingMode] = useState<AreaTrainingMode | null>(null);

  const closeAllOverlays = () => {
    setShowMenu(false);
    setShowTown(null);
    setShowDex(false);
    setShowEquipDex(false);
    setShowDojo(false);
    setShowSettings(false);
    setShowHowto(false);
    setShowStageSelect(false);
    setShowSaveMenu(false);
    setShowTeacher(false);
  };

  const closeAllFieldLists = () => {
    setShowFieldHealList(false);
    setShowFieldItemList(false);
  };

  const state: UIState = {
    showMenu,
    showTown,
    showDex,
    showEquipDex,
    showDojo,
    showFieldHealList,
    showFieldItemList,
    showSettings,
    showHowto,
    showStageSelect,
    showSaveMenu,
    topStatusExpanded,
    padObscured,
    padHasDragged,
    settingsTab,
    dojoMode,
    showStory,
    showTeacher,
    areaTrainingMode,
  };

  const actions: UIActions = {
    setShowMenu,
    setShowTown,
    setShowDex,
    setShowEquipDex,
    setShowDojo,
    setShowFieldHealList,
    setShowFieldItemList,
    setShowSettings,
    setShowHowto,
    setShowStageSelect,
    setShowSaveMenu,
    setTopStatusExpanded,
    setPadObscured,
    setPadHasDragged,
    setSettingsTab,
    setDojoMode,
    setShowStory,
    setShowTeacher,
    setAreaTrainingMode,
    closeAllOverlays,
    closeAllFieldLists,
  };

  return { state, actions };
}
