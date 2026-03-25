"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, Weapon, Armor, Tool, Scene, GameMode, BattleState } from '../lib/gameTypes';
import Topbar from "../components/Topbar";
import { useUIState } from "../hooks/useUIState";
import { useBrainOnlyMode } from "../hooks/useBrainOnlyMode";
import { usePadOverlapDetection } from "../hooks/usePadOverlapDetection";
import { usePlayTime } from "../hooks/usePlayTime";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useGamepadControls } from "../hooks/useGamepadControls";
import { useSaveData } from "./hooks/useSaveData";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useFirstRunLayout } from "./hooks/useFirstRunLayout";
import { useDexManagement } from "./hooks/useDexManagement";
import { GameProvider } from "./contexts/GameContext";

/**
 * DragonQuest-like RPG × NUMTRAIN Battle (Single-file, React/TSX)
 * - Scenes: Title / Map / Battle / Result
 * - Overlays: Settings, HowTo, Menu, Town(Shop/Inn), Bestiary
 * - Save/Load: localStorage ("dq_like_brain_v1")
 * - Difficulty: easy / normal / hard
 * - Battle Quiz Types (current): SUM / MISSING / COMPARE / PAIR / ORDER / MAX_MIN (EVEN_ODDは現在出題しない)
 *   Removed types / 詳細履歴は CHANGELOG.md を参照
 * - D-Pad overlay (anchor/size/opacity)
 * - No external deps
 */

/* -------------------- Types -------------------- */
// Scene, GameMode types moved to lib/gameTypes.ts
// Tile, Vec, AreaInfo moved to lib/world/areas.ts
import { Tile, AreaInfo, AREAS, createRandomMap } from '../lib/world/areas';
import { LIBRARY_AREAS } from '../lib/world/areasLibrary';
import { pickBackgroundForFloor, pickEndlessRunTheme, ENDLESS_CONFIG } from '../lib/world/endless';
import { Settings } from '../lib/settings';
// movement functions now handled by handlers
// encounter functions now handled by handlers
import { BattleAnimState, LevelUpDialogState, ConfirmDialogState, EquipDexState } from './types';
import { LevelUpInfo, LevelUpDetail } from '../lib/battle/flow';
import { createEquipDexUpdater, buildBattleBackgroundStyle, getAreaClearBannerState } from './utils';
import { buyWeapon, buyArmor, buyTool, restAtInn } from './handlers/handleShopActions';
import { handleUseItemField, castFieldHeal } from './handlers/handleFieldActions';
import { handleBrainOnlyResult } from './handlers/handleBrainOnlyResult';
import { handleEquipAccessory } from './handlers/handleEquipAccessory';
import { handleBattleItemUse } from './handlers/handleBattleItemUse';
import { handleBattleLogClick, handleAdvanceBattleLog } from './handlers/handleBattleLog';
import { handleActivateSkillOrMagic } from './handlers/handleSkillOrMagic';
import { handleEnemyStrike } from './handlers/handleEnemyStrike';
import { handleExpGoldReward } from './handlers/handleExpGoldReward';
import { handleStartBrainQuiz } from './handlers/handleStartBrainQuiz';
import { handleStartBrainOnlyQuiz } from './handlers/handleStartBrainOnlyQuiz';
import { handleStartEncounter } from './handlers/handleStartEncounter';
import { handleDoSaveToSlot } from './handlers/handleSaveOperations';
import { handleDoLoad, handleDoLoadFromSlot } from './handlers/handleLoadOperations';
import { handleChangeStage } from './handlers/handleChangeStage';
import { handleChangeFloor } from './handlers/handleChangeFloor';
import { handleConfirmDialog } from './handlers/handleConfirmDialog';
import { handleDeleteSlot } from './handlers/handleDeleteSlot';
import { handleExportSave } from './handlers/handleExportSave';
import { handleImportSave } from './handlers/handleImportSave';
import { handleResetGame } from './handlers/handleResetGame';
import { handleVibration } from './handlers/handleVibration';
import { handleQuizResult } from './handlers/handleQuizResult';
import { handleTryMove } from './handlers/handleTryMove';
import LevelUpDialog from './components/LevelUpDialog';
import SavePopup from './components/SavePopup';
import ConfirmDialog from './components/ConfirmDialog';
import OverlaysRenderer from './components/OverlaysRenderer';
import SceneRenderer from './components/SceneRenderer';
import UiScalerWrapper from './components/UiScalerWrapper';

// SaveData type moved to lib/saveSystem.ts
// BattleState type moved to lib/gameTypes.ts
// Settings types and utilities moved to lib/settings.ts

/* -------------------- RNG & Utils -------------------- */
import { pick } from '../lib/rng';
import { TimerManager } from '../lib/timerManager';
import { createInitialSettings, createInitialPlayer } from './initialState';

/* -------------------- Equipment / Shop -------------------- */
// Equipment data moved to lib/equipment.ts


/* -------------------- Player & Progress -------------------- */

/* -------------------- Maps & Story -------------------- */

/* -------------------- Save/Load -------------------- */
// Save/Load system moved to lib/saveSystem.ts

/* -------------------- Quiz (NUMTRAIN風) -------------------- */
import { QuizBundle, QuizType } from '../lib/quiz/types';
import { BATTLE_BG_GRADIENTS, DEFAULT_GRADIENT, UI_TIMINGS } from '../lib/ui/constants';

// 難問検出（クイズ内容から大まかな難易度の高さを推定）
// isHardQuiz moved to ./lib/quiz/difficulty

// バトル背景（画像版）: エリア別に背景画像を切り替え（存在しない場合はグラデでフォールバック）
const BATTLE_BG_IMAGE: Record<number, string> = {
  1: '/images/backgrounds/plains.png',
  2: '/images/backgrounds/forest.png',
  3: '/images/backgrounds/cave.png',
  4: '/images/backgrounds/volcano.png',
  5: '/images/backgrounds/ice.png',
  6: '/images/backgrounds/castle.png',
  7: '/images/backgrounds/tower.png',
  8: '/images/backgrounds/void.png',
  9: '/images/backgrounds/bossroom.png',
};

/* -------------------- Component -------------------- */
export default function DQBrain() {
  /* ---- states ---- */
  // UI state management (consolidated)
  const { state: uiState, actions: uiActions } = useUIState();

  // Destructure for easier access (will gradually migrate to uiState.*)
  const {
    showMenu, showTown, showDex, showEquipDex, showDojo,
    showFieldHealList, showFieldItemList, showSettings, showHowto,
    showStageSelect, showSaveMenu, topStatusExpanded,
    padHasDragged, settingsTab, dojoMode, showTeacher
  } = uiState;
  // Note: padObscured is computed by usePadOverlapDetection hook, not from uiState

  const {
    setShowMenu, setShowTown, setShowDex, setShowEquipDex, setShowDojo,
    setShowFieldHealList, setShowFieldItemList, setShowSettings, setShowHowto,
    setShowStageSelect, setShowSaveMenu, setTopStatusExpanded,
    setPadHasDragged, setSettingsTab, setDojoMode, setShowTeacher
  } = uiActions;
  // Note: setPadObscured removed - padObscured is computed, not managed

  // Brain-Only mode state management (consolidated)
  const { state: brainState, actions: brainActions } = useBrainOnlyMode();

  // Destructure for easier access
  const {
    quiz: brainOnlyQuiz,
    stats: brainOnlyStats,
    showSetup: showBrainOnlySetup,
    showConfig: showBrainOnlyConfig,
    showResult: showBrainOnlyResult,
    draft: brainOnlyDraft,
    enemy: brainEnemy,
    enemyAnim: brainEnemyAnim,
    mode: brainOnlyMode,
    target: brainOnlyTarget,
    records: brainOnlyRecords
  } = brainState;

  const {
    setQuiz: setBrainOnlyQuiz,
    setStats: setBrainOnlyStats,
    setShowSetup: setShowBrainOnlySetup,
    setShowConfig: setShowBrainOnlyConfig,
    setShowResult: setShowBrainOnlyResult,
    setDraft: setBrainOnlyDraft,
    setEnemy: setBrainEnemy,
    setEnemyAnim: setBrainEnemyAnim,
    setMode: setBrainOnlyMode,
    setTarget: setBrainOnlyTarget,
    setRecords: setBrainOnlyRecords
  } = brainActions;

  const topStatusDetailRef = useRef<HTMLDivElement | null>(null);
  const padWrapRef = useRef<HTMLDivElement | null>(null);
  const timerManagerRef = useRef<TimerManager>(new TimerManager());
  const [scene, setScene] = useState<Scene>("title");
  const [settings, setSettings] = useState<Settings>(createInitialSettings);
  const [player, setPlayer] = useState<Player>(() => createInitialPlayer(settings.avatar));
  // Brain-Only mode state now managed by useBrainOnlyMode hook above

  // Pad overlap detection (consolidated hook)
  const padObscuredComputed = usePadOverlapDetection({
    topStatusExpanded,
    topStatusDetailRef,
    padWrapRef,
    layoutDeps: [settings.tileSize, player.hp, player.mp, player.lv]
  });

  // Cleanup all timers on component unmount
  useEffect(() => {
    const timerManager = timerManagerRef.current;
    return () => {
      timerManager.clearAll();
    };
  }, []);

  // スキル/魔法の習得状況 - moved to lib/skills.ts
  // tileSizeはsettingsに統合
  const { playTime, setPlayTime } = usePlayTime(); // プレイ時間（秒）
  const [savePopup, setSavePopup] = useState({ visible: false });

  const [toasts, setToasts] = useState<string[]>([]);
  const addToast = useCallback((t: string) => {
    setToasts(s => [...s, t]);
    timerManagerRef.current.setTimeout(() => setToasts(s => s.slice(1)), UI_TIMINGS.TOAST_DURATION);
  }, []);

  // UI state (showMenu, showDex, etc.) now managed by useUIState hook above
  // レベルアップ詳細ダイアログ（手動クローズ）
  const [levelUpDialog, setLevelUpDialog] = useState<LevelUpDialogState>({ visible: false });

  // 確認ダイアログ（中央表示）
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ visible: false, message: "" });

  // Battle
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [enemyImageError, setEnemyImageError] = useState(false);
  const [quizCombo, setQuizCombo] = useState(0);
  const [battleAnim, setBattleAnim] = useState<BattleAnimState | null>(null);
  const enemyPanelRef = useRef<HTMLDivElement | null>(null);
  // Mode and split dex
  const [gameMode, setGameMode] = useState<GameMode>('story');
  const [equipDex, setEquipDex] = useState<EquipDexState>({ weapons: [], armors: [] });
  // Library Dojo: quiz types override (persist in area until cleared)
  const [quizTypesOverride, setQuizTypesOverride] = useState<QuizType[] | null>(null);

  // Dex management with custom hook (consolidates dexStory/dexEndless logic)
  const {
    dexStory,
    dexEndless,
    currentDex,
    setDexStory,
    setDexEndless,
    recordSeen,
    recordDefeated,
  } = useDexManagement(gameMode);

  // 装備図鑑登録ヘルパ
  const addToEquipDex = useCallback((kind: 'weapon' | 'armor', name: string) => {
    setEquipDex(createEquipDexUpdater(kind, name));
  }, []);

  // Load save data and live settings on mount
  useSaveData({
    setPlayer,
    setSettings,
    setDexStory,
    setDexEndless,
    setEquipDex,
    setGameMode,
    setQuizCombo,
  });

  // Sync settings changes to localStorage
  useSettingsSync(settings);

  // Initialize first-run layout based on device
  useFirstRunLayout({ setSettings });

  // S10 Phase 5: Game State Adapter Layer
  // 
  // This adapter provides a centralized point for core game logic that mirrors useGameState's API.
  // It serves as preparation for potential future migration to useGameState as the source of truth.
  // Currently, the adapter uses DQBrain's existing state management but structures the code
  // to match useGameState's patterns, using the same helper functions from lib/.
  //
  // ADAPTER PATTERN:
  // - Each adapter method corresponds to a useGameState.actions method
  // - Maintains DQBrain's additional state (dex, UI, animations) that useGameState doesn't handle
  // - Uses shared helper functions (calculateNewPosition, isWalkable, pickEnemy, etc.)
  // - Provides clear integration points for future full migration
  //
  // BENEFITS:
  // - Centralized game logic access point
  // - Clear separation between core game logic and UI logic
  // - Easier testing and maintenance
  // - Smooth path for future useGameState integration
  // アクセ装備変更（単一枠）
  // Equip accessory handler moved to handlers/handleEquipAccessory.ts
  const equipAccessory = useCallback((name: string) => {
    const equipAccessoryDeps = { player, setPlayer, addToast };
    return handleEquipAccessory(name, equipAccessoryDeps);
  }, [player, addToast]);

  // 戻る時の確認: ダイアログ多重を避けるため、ハンドラは一度だけ登録し、状態はrefで参照する
  const hasRiskRef = useRef(false);
  const suppressBeforeUnloadRef = useRef(false);

  // hasRisk を常に最新値に更新
  useEffect(() => {
    hasRiskRef.current = (scene !== 'title') || !!(showTown || showMenu || showDex || showDojo || showSettings || showHowto || showStageSelect || showSaveMenu);
  }, [scene, showTown, showMenu, showDex, showDojo, showSettings, showHowto, showStageSelect, showSaveMenu]);

  // 画面離脱時の確認（beforeunload）: 一度だけ登録し、refで条件を見る
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: BeforeUnloadEvent) => {
      if (hasRiskRef.current && !suppressBeforeUnloadRef.current) {
        e.preventDefault();
        e.returnValue = '';
      } else {
        // 直前にOK済みの遷移は抑止フラグを消灯して素通り
        suppressBeforeUnloadRef.current = false;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // ブラウザの「戻る」操作に対するガード: 1回だけダミー履歴を積み、popstateで確認
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      history.pushState({ guard: 'bmq' }, '', window.location.href);
    } catch {
      // Silently ignore - may fail in iframe or restricted context
    }
    const onPop = (_e: PopStateEvent) => {
      if (!hasRiskRef.current) {
        // リスクなし: このハンドラを解除して通常の戻るへ
        window.removeEventListener('popstate', onPop);
        history.back();
        return;
      }
      const ok = window.confirm('画面を離れますか？未保存の進行は失われる可能性があります。');
      if (ok) {
        // beforeunloadの二重ダイアログを抑止
        suppressBeforeUnloadRef.current = true;
        window.removeEventListener('popstate', onPop);
        history.back();
      } else {
        // キャンセル: ガードを積み直す
        try {
          history.pushState({ guard: 'bmq' }, '', window.location.href);
        } catch {
          // Silently ignore - may fail in iframe or restricted context
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Story & Area
  const [showStory, setShowStory] = useState<string | null>(null);
  const currentAreaInfo = useMemo(() =>
    gameMode === 'endless'
      ? {
        id: player.currentArea,
        ...ENDLESS_CONFIG,
        map: createRandomMap(player.endlessFloor || 1),
        bossDefeated: false,
        mainline: false
      } as AreaInfo
      : (() => {
        const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
        return currentAreas.find(a => a.id === player.currentArea) || currentAreas[0];
      })(),
    [gameMode, player.currentArea, player.endlessFloor]
  );

  // 無限の回廊では階層ごとにランダムマップを生成
  const currentMap = useMemo(() => {
    if (gameMode === 'endless') {
      const floor = player.endlessFloor || 1;
      return createRandomMap(floor);
    }
    return currentAreaInfo.map;
  }, [gameMode, player.endlessFloor, currentAreaInfo.map]);

  // Compute area clear banner state once for map display
  // Only re-compute when relevant properties change (optimization)
  const areaBannerState = useMemo(() =>
    getAreaClearBannerState({ player, currentAreaInfo, currentDex }),
    [player, currentAreaInfo, currentDex]
  );

  // Clear dojo override on area change
  useEffect(() => {
    setQuizTypesOverride(null);
  }, [player.currentArea]);

  // S10 Phase 1: useGameState integration for core game logic
  // Initialize useGameState hook for movement/encounter/quiz delegation
  // Note: DQBrain still maintains UI state (overlays, animations, etc.) separately
  // 道場スナップは撤廃：初期位置とエリア変更時の処理に一元化（不要なポジションジャンプを防止）

  // Endless mode: per-floor randomized background from existing pool
  const isEndlessMode = gameMode === 'endless';
  // Endless: stick to a single background per run (session) chosen at start of the run
  const [endlessRunBg, setEndlessRunBg] = useState<string | null>(null);

  // Battle panel background style (memoized to avoid re-renders)
  const battlePanelBgStyle: React.CSSProperties = useMemo(() => {
    // Endless: 階層ごとに背景を選択
    const bgImg = isEndlessMode
      ? pickBackgroundForFloor(player.endlessFloor || 1)
      : BATTLE_BG_IMAGE[player.currentArea];
    // 背景画像の多重レイヤー（画像1枚 + グラデーション）
    const bgImgList: string[] = bgImg ? [bgImg] : [];
    const gradient = BATTLE_BG_GRADIENTS[player.currentArea] || DEFAULT_GRADIENT;
    const bgStyleProps = buildBattleBackgroundStyle(bgImgList, gradient);

    return {
      // 画像レイヤーを最前面、その下にグラデーション（順序が重要）
      ...bgStyleProps,
      borderRadius: 18,
      boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
      aspectRatio: '1 / 1',
      width: '100%',
      maxWidth: 480,
      minWidth: 240,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      position: 'relative',
      padding: '24px 12px 18px 12px',
    };
  }, [isEndlessMode, player.endlessFloor, player.currentArea]);

  /* ---- effects ---- */
  // プレイ時間の計測 - moved to usePlayTime hook

  // 敵が切り替わったら画像エラーフラグをリセット
  useEffect(() => {
    setEnemyImageError(false);
  }, [battle?.enemy?.imageUrl, battle?.enemy?.name]);

  // Endless run: when entering endless mode from title, pick a theme and show story once
  useEffect(() => {
    if (scene === 'map' && gameMode === 'endless' && !endlessRunBg) {
      const seed = Date.now() & 0xffff;
      const theme = pickEndlessRunTheme(seed);
      setEndlessRunBg(theme.background);
      setShowStory('intro');
      // Temporarily override the story intro for the endless area
      // We show via showStory === 'intro', but the text comes from local state below in render
      (window as Window & { __endlessIntro?: string }).__endlessIntro = theme.story;
    }
  }, [scene, gameMode, endlessRunBg]);

  useEffect(() => {
    setPlayer(p => ({ ...p, avatar: settings.avatar }));
  }, [settings.avatar]);

  // エリア変更時にストーリーを表示（最初の一回のみ）
  const bossKey = currentAreaInfo.bossName;
  const bossDefeated = currentDex[bossKey]?.defeated ?? 0;
  const shownCount = player.storyShownAreas.length;
  const shownAreasRef = player.storyShownAreas;
  useEffect(() => {
    if (scene !== "map") return;
    const areaCleared = bossDefeated > 0;
    const alreadyShown = shownAreasRef.includes(player.currentArea);
    if (!areaCleared && !alreadyShown) {
      const timer = setTimeout(() => {
        setShowStory("intro");
        setPlayer(p => ({
          ...p,
          storyShownAreas: [...p.storyShownAreas, p.currentArea]
        }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [player.currentArea, shownCount, scene, bossKey, bossDefeated, shownAreasRef]);

  /* ---- helpers ---- */
  const pushLog = useCallback((msg: string) => setBattle(b => b ? { ...b, log: [...b.log, msg] } : b), []);

  const vibrate = useCallback((ms: number) => handleVibration(ms), []);

  // Encounter handler moved to handlers/handleStartEncounter.ts
  const startEncounter = useCallback((tile: Tile) => {
    const startEncounterDeps = { player, gameMode, settings, currentDex, pick, setBattle, setScene, recordSeen };
    handleStartEncounter(tile, startEncounterDeps);
  }, [player, gameMode, settings, currentDex, recordSeen]);

  // Movement handler moved to handlers/handleTryMove.ts
  const tryMove = useCallback((dr: number, dc: number) => {
    const tryMoveDeps = {
      timerManager: timerManagerRef.current,
      scene,
      player,
      gameMode,
      settings,
      currentMap,
      currentAreaInfo,
      currentDex,
      showTown,
      showMenu,
      showDex,
      showDojo,
      showSettings,
      showHowto,
      showStageSelect,
      showSaveMenu,
      showStory,
      setPlayer,
      setBattle,
      setScene,
      setShowStory,
      setShowTown,
      setShowDojo,
      addToast,
      recordSeen,
      startEncounter,
      equipAccessory
    };
    handleTryMove(dr, dc, tryMoveDeps);
  }, [scene, player, gameMode, settings, currentMap, currentAreaInfo, currentDex,
    showTown, showMenu, showDex, showDojo, showSettings, showHowto, showStageSelect, showSaveMenu, showStory,
    setShowDojo, setShowTown,
    addToast, recordSeen, startEncounter, equipAccessory]);

  // カスタム確認ダイアログを表示（Promise版）
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    const confirmDialogDeps = { setConfirmDialog };
    return handleConfirmDialog(message, confirmDialogDeps);
  }, []);

  // Save operations handler moved to handlers/handleSaveOperations.ts
  const doSaveToSlot = useCallback((slot: number) => {
    const saveOperationsDeps = { timerManager: timerManagerRef.current, player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast, setSavePopup, setShowSaveMenu };
    handleDoSaveToSlot(slot, saveOperationsDeps);
  }, [player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast, setShowSaveMenu]);

  // Load operations handler moved to handlers/handleLoadOperations.ts
  const doLoad = useCallback(() => {
    const loadOperationsDeps = { setPlayer, setSettings, setDexStory, setDexEndless, setEquipDex, setGameMode, setQuizCombo, setPlayTime, setScene, addToast, setShowSaveMenu };
    return handleDoLoad(loadOperationsDeps);
  }, [addToast, setShowSaveMenu, setDexStory, setDexEndless, setPlayTime]);

  const doLoadFromSlot = useCallback((slot: number) => {
    const loadOperationsDeps = { setPlayer, setSettings, setDexStory, setDexEndless, setEquipDex, setGameMode, setQuizCombo, setPlayTime, setScene, addToast, setShowSaveMenu };
    handleDoLoadFromSlot(slot, loadOperationsDeps);
  }, [addToast, setShowSaveMenu, setDexStory, setDexEndless, setPlayTime]);

  const doDeleteSlot = useCallback((slot: number) => {
    const deleteSlotDeps = { addToast };
    handleDeleteSlot(slot, deleteSlotDeps);
  }, [addToast]);

  // Stage change handler moved to handlers/handleChangeStage.ts
  const changeStage = useCallback((areaId: number) => {
    const changeStageDeps = { player, gameMode, setPlayer, setShowStageSelect, addToast };
    handleChangeStage(areaId, changeStageDeps);
  }, [player, gameMode, addToast, setShowStageSelect]);

  // Floor change handler for endless mode
  const changeFloor = useCallback((floor: number) => {
    const changeFloorDeps = { player, setPlayer, setShowStageSelect, addToast };
    handleChangeFloor(floor, changeFloorDeps);
  }, [player, addToast, setShowStageSelect]);

  const doExport = useCallback(() => {
    const exportSaveDeps = { player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast };
    handleExportSave(exportSaveDeps);
  }, [player, settings, dexStory, dexEndless, equipDex, quizCombo, playTime, gameMode, addToast]);

  const doImport = useCallback((file: File) => {
    const importSaveDeps = { setPlayer, setSettings, setDexStory, setDexEndless, setEquipDex, setGameMode, setQuizCombo, setPlayTime, setScene, addToast, setShowSaveMenu };
    handleImportSave(file, importSaveDeps);
  }, [addToast, setShowSaveMenu, setDexStory, setDexEndless, setPlayTime]);

  // Experience and gold reward handler moved to handlers/handleExpGoldReward.ts
  const giveExpGold = useCallback((exp: number, gold: number): { levelUp?: LevelUpInfo, details?: LevelUpDetail[] } => {
    const expGoldRewardDeps = { timerManager: timerManagerRef.current, player, setPlayer, addToast, setBattleAnim, setLevelUpDialog };
    return handleExpGoldReward(exp, gold, expGoldRewardDeps);
  }, [player, addToast]);

  /* -------------------- Brain-Quiz Battle -------------------- */
  // Brain quiz handler moved to handlers/handleStartBrainQuiz.ts
  const startBrainQuiz = useCallback((pack: "attack" | "fire" | "heal" | "run") => {
    const startBrainQuizDeps = { battle, player, settings, dojoMode, setBattle, addToast, gameMode, currentAreaId: currentAreaInfo.id, quizTypesOverride };
    handleStartBrainQuiz(pack, startBrainQuizDeps);
  }, [battle, player, settings, dojoMode, addToast, gameMode, currentAreaInfo.id, quizTypesOverride]);

  const doAttack = useCallback(() => startBrainQuiz("attack"), [startBrainQuiz]);
  const doRun = useCallback(() => startBrainQuiz("run"), [startBrainQuiz]);
  const _doMagic = useCallback((kind: "fire" | "heal") => { startBrainQuiz(kind); }, [startBrainQuiz]);

  // Keyboard controls (Map & Battle) - moved to useKeyboardControls hook
  // Must be called after tryMove and startBrainQuiz are defined
  useKeyboardControls({
    scene,
    battle,
    tryMove,
    setShowMenu,
    startBrainQuiz
  });

  // Gamepad/Controller controls (Map & Battle)
  // Supports continuous movement when holding direction buttons
  useGamepadControls({
    scene,
    battle,
    tryMove,
    setShowMenu,
    startBrainQuiz
  });

  /* -------------------- Brain-Only Mode -------------------- */
  // Brain-only quiz handler moved to handlers/handleStartBrainOnlyQuiz.ts
  const startBrainOnlyQuiz = useCallback(() => {
    const startBrainOnlyQuizDeps = { settings, setBrainEnemy, setBrainOnlyQuiz };
    handleStartBrainOnlyQuiz(startBrainOnlyQuizDeps);
  }, [settings, setBrainEnemy, setBrainOnlyQuiz]);

  // handleBrainOnlyResult moved to handlers/handleBrainOnlyResult.ts
  const handleBrainOnlyResultLocal = useCallback((ok: boolean, quizBundle: QuizBundle) => {
    handleBrainOnlyResult(ok, quizBundle, {
      timerManager: timerManagerRef.current,
      brainOnlyStats,
      brainOnlyMode,
      brainOnlyTarget,
      setBrainOnlyRecords,
      setBrainOnlyStats,
      setBrainEnemyAnim,
      addToast,
      setShowBrainOnlyResult,
      setBrainOnlyQuiz,
      startBrainOnlyQuiz
    });
  }, [brainOnlyStats, brainOnlyMode, brainOnlyTarget, addToast, startBrainOnlyQuiz,
    setBrainOnlyRecords, setBrainOnlyStats, setBrainEnemyAnim, setShowBrainOnlyResult, setBrainOnlyQuiz]);

  // 新：必殺技/各魔法の起動
  // Skill/magic activation handler moved to handlers/handleSkillOrMagic.ts
  const activateSkillOrMagic = useCallback((s: { key: string; name: string; rank: number; mp?: number; type: 'skill' | 'fire' | 'heal'; power: number }) => {
    const skillOrMagicDeps = { battle, player, settings, dojoMode, setBattle, addToast };
    handleActivateSkillOrMagic(s, skillOrMagicDeps);
  }, [battle, player, settings, dojoMode, addToast]);

  // Enemy strike handler moved to handlers/handleEnemyStrike.ts
  const enemyStrike = useCallback((nextCheck = true) => {
    const enemyStrikeDeps = { timerManager: timerManagerRef.current, battle, player, setPlayer, setBattleAnim, pushLog, vibrate, setScene };
    handleEnemyStrike(nextCheck, enemyStrikeDeps);
  }, [battle, player, pushLog, vibrate]);

  // Quiz result handler moved to handlers/handleQuizResult.ts
  const handleQuizResultLocal = useCallback((ok: boolean, pack: "attack" | "fire" | "heal" | "run", power: number) => {
    const quizResultDeps = {
      timerManager: timerManagerRef.current,
      battle,
      player,
      gameMode,
      quizCombo,
      settings,
      equipDex,
      currentAreaInfo,
      enemyPanelRef,
      currentDex,
      dojoMode,
      brainOnlyMode,
      brainOnlyTarget,
      brainOnlyStats,
      setBattle,
      setPlayer,
      setQuizCombo,
      setBattleAnim,
      setScene,
      setShowStory,
      setEquipDex,
      setBrainOnlyStats,
      setShowBrainOnlyResult,
      startEncounter,
      addToast,
      pushLog,
      vibrate,
      enemyStrike,
      giveExpGold,
      recordDefeated,
      addToEquipDex
    };
    handleQuizResult(ok, pack, power, quizResultDeps);
  }, [battle, player, gameMode, quizCombo, settings, equipDex, currentAreaInfo, currentDex,
    dojoMode, brainOnlyMode, brainOnlyTarget, brainOnlyStats,
    setBrainOnlyStats, setShowBrainOnlyResult, startEncounter,
    addToast, pushLog, vibrate, enemyStrike, giveExpGold, recordDefeated, addToEquipDex]);

  /* -------------------- Town -------------------- */
  // Shop action handlers moved to handlers/handleShopActions.ts
  const buyWeaponLocal = useCallback((w: Weapon) => {
    const shopActionDeps = { player, setPlayer, addToast, showConfirm, addToEquipDex };
    return buyWeapon(w, shopActionDeps);
  }, [player, addToast, showConfirm, addToEquipDex]);

  const buyArmorLocal = useCallback((a: Armor) => {
    const shopActionDeps = { player, setPlayer, addToast, showConfirm, addToEquipDex };
    return buyArmor(a, shopActionDeps);
  }, [player, addToast, showConfirm, addToEquipDex]);

  const buyToolLocal = useCallback((t: Tool) => {
    const shopActionDeps = { player, setPlayer, addToast, showConfirm, addToEquipDex };
    return buyTool(t, shopActionDeps);
  }, [player, addToast, showConfirm, addToEquipDex]);

  const restAtInnLocal = useCallback(() => {
    const shopActionDeps = { player, setPlayer, addToast, showConfirm, addToEquipDex };
    return restAtInn(shopActionDeps);
  }, [player, addToast, showConfirm, addToEquipDex]);

  // Battle item use handler moved to handlers/handleBattleItemUse.ts
  const handleUseItem = useCallback((idx: number) => {
    const battleItemUseDeps = { player, setPlayer, addToast, setQuizCombo };
    handleBattleItemUse(idx, battleItemUseDeps);
  }, [player, addToast]);

  // Field action handlers moved to handlers/handleFieldActions.ts
  const handleUseItemFieldLocal = useCallback((idx: number) => {
    const fieldActionDeps = { player, setPlayer, addToast, setQuizCombo, showConfirm };
    return handleUseItemField(idx, fieldActionDeps);
  }, [player, addToast, showConfirm]);

  const castFieldHealLocal = useCallback((mpCost: number, ratio: number, label: string, requiredKey?: string, fullHeal?: boolean) => {
    const fieldActionDeps = { player, setPlayer, addToast, setQuizCombo, showConfirm };
    return castFieldHeal(mpCost, ratio, label, requiredKey, fullHeal, fieldActionDeps);
  }, [player, addToast, showConfirm]);

  /* -------------------- UI helpers -------------------- */
  // Battle log handlers moved to handlers/handleBattleLog.ts
  const onLogClick = useCallback(() => {
    const battleLogDeps = { battle, setBattle, setScene, pushLog };
    handleBattleLogClick(battleLogDeps);
  }, [battle, pushLog]);

  const advanceLog = useCallback(() => {
    const battleLogDeps = { battle, setBattle, setScene, pushLog };
    handleAdvanceBattleLog(battleLogDeps);
  }, [battle, pushLog]);

  // スタイル関数はコンポーネント側へ移動（PadOverlay）

  // 旧インラインのドラッグは各コンポーネントで扱う

  // 全リセット（タイトルの「物語を始める」「無限の回廊」から使用）
  const resetAll = useCallback((areaId?: number, mode?: GameMode) => {
    const resetDeps = {
      settings,
      setGameMode,
      setPlayer,
      setBattle,
      setDexStory,
      setDexEndless,
      setEquipDex,
      setQuizCombo,
      setEndlessRunBg,
      addToast,
    };
    handleResetGame(areaId, mode, resetDeps);
  }, [settings, addToast, setDexStory, setDexEndless]);

  /* -------------------- Render -------------------- */
  // Prepare state and actions for GameProvider
  const gameState = useMemo(() => ({
    // Core game state
    scene,
    gameMode,
    player,
    battle,
    battleAnim,
    enemyImageError,
    battlePanelBgStyle,

    // Map and area
    currentMap,
    currentAreaInfo,
    currentDex,
    dexStory,
    dexEndless,
    equipDex,
    areaBannerState,

    // Settings and UI
    settings,
    quizCombo,
    topStatusExpanded,
    padObscuredComputed,
    padHasDragged,
    dojoMode,
    playTime,
    quizTypesOverride,

    // UI overlays state
    showMenu,
    showTown,
    showDex,
    showEquipDex,
    showDojo,
    showTeacher,
    showFieldHealList,
    showFieldItemList,
    showSettings,
    showHowto,
    showStageSelect,
    showSaveMenu,
    showStory,
    settingsTab,

    // Brain-only mode
    brainEnemy,
    brainEnemyAnim,
    brainOnlyStats,
    brainOnlyQuiz,
    brainOnlyMode,
    brainOnlyTarget,
    brainOnlyRecords,
    brainOnlyDraft,
    showBrainOnlySetup,
    showBrainOnlyConfig,
    showBrainOnlyResult,

    // Toasts
    toasts,
  }), [
    scene, gameMode, player, battle, battleAnim, enemyImageError, battlePanelBgStyle,
    currentMap, currentAreaInfo, currentDex, dexStory, dexEndless, equipDex, areaBannerState,
    settings, quizCombo, topStatusExpanded, padObscuredComputed, padHasDragged, dojoMode, playTime, quizTypesOverride,
    showMenu, showTown, showDex, showEquipDex, showDojo, showTeacher, showFieldHealList, showFieldItemList,
    showSettings, showHowto, showStageSelect, showSaveMenu, showStory, settingsTab,
    brainEnemy, brainEnemyAnim, brainOnlyStats, brainOnlyQuiz, brainOnlyMode, brainOnlyTarget,
    brainOnlyRecords, brainOnlyDraft, showBrainOnlySetup, showBrainOnlyConfig, showBrainOnlyResult,
    toasts
  ]);

  const gameActions = useMemo(() => ({
    // Core actions
    setScene,
    setGameMode,
    setPlayer,
    setBattle,
    setBattleAnim,
    setEnemyImageError,
    setQuizCombo,
    setSettings,
    setDexStory,
    setDexEndless,
    setEquipDex,
    setPlayTime,

    // UI actions
    setShowMenu,
    setShowTown,
    setShowDex,
    setShowEquipDex,
    setShowDojo,
    setShowTeacher,
    setShowFieldHealList,
    setShowFieldItemList,
    setShowSettings,
    setShowHowto,
    setShowStageSelect,
    setShowSaveMenu,
    setShowStory,
    setTopStatusExpanded,
    setPadHasDragged,
    setDojoMode,
    setSettingsTab,
    setQuizTypesOverride,

    // Brain-only actions
    setBrainEnemy,
    setBrainEnemyAnim,
    setBrainOnlyQuiz,
    setBrainOnlyStats,
    setBrainOnlyRecords,
    setBrainOnlyDraft,
    setBrainOnlyMode,
    setBrainOnlyTarget,
    setShowBrainOnlySetup,
    setShowBrainOnlyConfig,
    setShowBrainOnlyResult,

    // Game handlers
    addToast,
    tryMove,
    resetAll,
    showConfirm,
    doAttack,
    doRun,
    activateSkillOrMagic,
    handleUseItem,
    handleQuizResultLocal,
    advanceLog,
    onLogClick,
    doLoad,
    startEncounter,
    handleBrainOnlyResultLocal,
    startBrainOnlyQuiz,

    // Field actions
    castFieldHealLocal,
    handleUseItemField: handleUseItemFieldLocal,

    // Shop actions
    buyWeaponLocal,
    buyArmorLocal,
    buyToolLocal,
    restAtInnLocal,

    // Stage and save actions
    changeStage,
    changeFloor,
    doSaveToSlot,
    doLoadFromSlot,
    doDeleteSlot,
    doExport,
    doImport,
  }), [
    setScene, setGameMode, setPlayer, setBattle, setBattleAnim, setEnemyImageError, setQuizCombo, setSettings,
    setDexStory, setDexEndless, setEquipDex, setPlayTime,
    setShowMenu, setShowTown, setShowDex, setShowEquipDex, setShowDojo, setShowTeacher, setShowFieldHealList, setShowFieldItemList,
    setShowSettings, setShowHowto, setShowStageSelect, setShowSaveMenu, setShowStory, setTopStatusExpanded,
    setPadHasDragged, setDojoMode, setSettingsTab,
    setBrainEnemy, setBrainEnemyAnim, setBrainOnlyQuiz, setBrainOnlyStats, setBrainOnlyRecords, setBrainOnlyDraft,
    setBrainOnlyMode, setBrainOnlyTarget, setShowBrainOnlySetup, setShowBrainOnlyConfig, setShowBrainOnlyResult,
    addToast, tryMove, resetAll, showConfirm, doAttack, doRun, activateSkillOrMagic, handleUseItem,
    handleQuizResultLocal, advanceLog, onLogClick, doLoad, startEncounter, handleBrainOnlyResultLocal,
    startBrainOnlyQuiz, castFieldHealLocal, handleUseItemFieldLocal, buyWeaponLocal, buyArmorLocal, buyToolLocal,
    restAtInnLocal, changeStage, changeFloor, doSaveToSlot, doLoadFromSlot, doDeleteSlot, doExport, doImport
  ]);

  return (
    <GameProvider state={gameState} actions={gameActions}>
      <div className="wrap" style={{ '--tile-size': `${settings.tileSize}px` } as React.CSSProperties}>
        <Topbar
          scene={scene}
          gameMode={gameMode}
          currentFloor={player.endlessFloor}
          onOpenMenu={() => setShowMenu(true)}
          onOpenStageSelect={() => setShowStageSelect(true)}
          onGoTitle={() => setScene("title")}
          onOpenHowto={() => setShowHowto(true)}
          onOpenSettings={() => {
            if (scene === 'brainOnly') {
              setBrainOnlyDraft(settings.brainOnly);
              setShowBrainOnlyConfig(true);
            } else {
              setShowSettings(true);
            }
          }}
          showConfirm={showConfirm}
        />


        {/* ヘッダー直下のUIスケーラー */}
        <UiScalerWrapper
          scene={scene}
          settings={settings}
          setSettings={setSettings}
        />

        {/* マップ専用スケーラーは削除（UIスケーラーに統一） */}


        <main className="main" style={{ alignItems: scene === "map" ? "start" : undefined }}>
          <SceneRenderer
            topStatusDetailRef={topStatusDetailRef}
            padWrapRef={padWrapRef}
            enemyPanelRef={enemyPanelRef}
          />

          {/* レベルアップ詳細ダイアログ（中央・手動クローズ） */}
          <LevelUpDialog
            levelUpDialog={levelUpDialog}
            onClose={() => setLevelUpDialog({ visible: false })}
          />

          {/* セーブ確認ポップアップ（中央・自動クローズ） */}
          <SavePopup visible={savePopup.visible} />

          {/* カスタム確認ダイアログ（中央表示） */}
          <ConfirmDialog confirmDialog={confirmDialog} />
        </main>

        {/* 下部バーは廃止。パッドとステータスは浮動オーバーレイとして個別に表示する */}

        <OverlaysRenderer />
      </div>
    </GameProvider>
  );

}

// セーブの最新をロード（存在しない場合null）
// loadSave() moved to lib/saveSystem.ts

/* -------------------- BrainQuiz Pane (moved to components/BrainQuizPane.tsx) -------------------- */

/* -------------------- Overlay (moved to components/Overlay.tsx) -------------------- */