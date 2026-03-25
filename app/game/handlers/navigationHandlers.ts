// ─── navigationHandlers.ts ────────────────────────────────
// Consolidation of: handleChangeStage, handleChangeFloor, handleTryMove,
//   handleResetGame, movement/bossEncounter, movement/guardianEncounter
// Phase 1: file merge only – no logic changes
// ──────────────────────────────────────────────────────────

import { Player, BattleState, Scene, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { validateMovement } from '../../lib/world/movementAdapter';
import { isAtPosition } from '../../lib/world/movement';
import { AreaInfo, Tile, AREAS, GUARDIANS_A7, createRandomMap } from '../../lib/world/areas';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';
import { ENDLESS_CONFIG, getFloorBoss, scaleStats } from '../../lib/world/endless';
import { allGuardiansDefeated, prepareGuardianEnemy, getGuardianReward, GUARDIAN_NAMES } from '../../lib/world/guardianEncounter';
import { BOSS_POOL } from '../../lib/enemies';
import { getKirinIntroLines } from '../../lib/world/bossEncounter';
import { WEAPONS, ARMORS, TOOLS } from '../../lib/equipment';
import { DexData, TownMenu, EquipDexState } from '../types';
import { TimerManager } from '../../lib/timerManager';

// ─── movement/guardianEncounter ───────────────────────────

export interface GuardianEncounterDeps {
  timerManager: TimerManager;
  settings: Settings;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: 'map' | 'battle') => void;
  setShowStory: (story: string | null) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
  equipAccessory: (name: string) => void;
}

export function checkGuardianEncounter(
  player: Player,
  newPos: { r: number; c: number },
  deps: GuardianEncounterDeps
): boolean {
  if (player.currentArea !== 7) return false;

  const f = player.flags || {};
  const { timerManager, settings, setPlayer, setBattle, setScene, setShowStory, addToast, recordSeen, equipAccessory } = deps;

  const startGuardianEncounter = (guardianName: string) => {
    setShowStory("bossEncounter");
    timerManager.setTimeout(() => {
      const enemy = prepareGuardianEnemy(guardianName, settings.difficulty);
      if (enemy) {
        const rewardName = getGuardianReward(guardianName);
        setBattle(() => ({
          enemy,
          log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
          queue: [],
          mode: "queue",
          quizStats: { total: 0, correct: 0, totalTime: 0 },
          onVictory: () => {
            if (rewardName) {
              setPlayer(p => ({
                ...p,
                keyItems: p.keyItems.includes(rewardName) ? p.keyItems : [...p.keyItems, rewardName]
              }));
              addToast(`${rewardName} を手に入れた！（認められた証）`);
              equipAccessory(rewardName);
            }
          }
        }));
        setScene("battle");
        recordSeen(enemy.name);
      }
    }, 200);
  };

  if (isAtPosition(newPos, GUARDIANS_A7.genbu) && !f.genbuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.GENBU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.seiryu) && !f.seiryuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.SEIRYU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.suzaku) && !f.suzakuDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.SUZAKU);
    return true;
  }
  if (isAtPosition(newPos, GUARDIANS_A7.byakko) && !f.byakkoDefeated) {
    startGuardianEncounter(GUARDIAN_NAMES.BYAKKO);
    return true;
  }

  return false;
}

// ─── movement/bossEncounter ───────────────────────────────

export interface BossEncounterDeps {
  timerManager: TimerManager;
  gameMode: GameMode;
  settings: Settings;
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: 'map' | 'battle') => void;
  setShowStory: (story: string | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
}

export function checkBossEncounter(
  player: Player,
  newPos: { r: number; c: number },
  deps: BossEncounterDeps
): { triggered: boolean; shouldStopMoving: boolean } {
  const { timerManager, gameMode, settings, currentAreaInfo, currentDex, setBattle, setScene, setShowStory, setPlayer, addToast, recordSeen } = deps;

  if (!isAtPosition(newPos, currentAreaInfo.bossPos)) {
    return { triggered: false, shouldStopMoving: false };
  }

  if (player.currentArea === 7) {
    const f = player.flags || {};
    if (!allGuardiansDefeated(f)) {
      addToast("四方に散る四聖獣のもとへ向かい、すべての試練を越えよ。");
      return { triggered: false, shouldStopMoving: false };
    }
  }

  const alwaysFightHere = player.currentArea === 9;
  const isEndlessMode = gameMode === 'endless';
  const bossDefeated = ((): number => {
    if (alwaysFightHere || isEndlessMode) return 0;
    if (player.currentArea === 7) {
      const f = player.flags || {};
      return allGuardiansDefeated(f) ? 1 : 0;
    }
    return currentDex[currentAreaInfo.bossName]?.defeated || 0;
  })();

  if (!(alwaysFightHere || isEndlessMode || bossDefeated === 0)) {
    return { triggered: false, shouldStopMoving: true };
  }

  // Endless mode floor boss
  if (isEndlessMode) {
    if ((window as typeof window & { __advancingFloor?: boolean }).__advancingFloor) {
      return { triggered: false, shouldStopMoving: true };
    }
    (window as typeof window & { __advancingFloor?: boolean }).__advancingFloor = true;
    setShowStory("bossEncounter");
    timerManager.setTimeout(() => {
      const floor = player.endlessFloor || 1;
      const bossBase = getFloorBoss(floor);
      const bossStats = scaleStats(floor, 'boss');
      const jitter = 0.9 + Math.random() * 0.2;
      const enemy = {
        ...bossBase,
        maxHP: Math.round(bossStats.maxHP * jitter),
        hp: Math.round(bossStats.hp * jitter),
        atk: Math.round(bossStats.atk * jitter),
        renderSize: Math.round((bossBase.renderSize || 160) * 1.5)
      };
      const lines = [`💀 第${floor}階層 フロアボス\n${enemy.emoji} ${enemy.name} が あらわれた！`];
      setBattle(() => ({
        enemy,
        log: [lines[0]],
        queue: [],
        mode: "queue",
        quizStats: { total: 0, correct: 0, totalTime: 0 },
        onVictory: () => {
          setPlayer(p => {
            const nextFloor = (p.endlessFloor || 1) + 1;
            addToast(`👑 第${floor}階層 クリア！ 第${nextFloor}階層へ進む…`);
            return {
              ...p,
              endlessFloor: nextFloor,
              pos: currentAreaInfo.startPos
            };
          });
        }
      }));
      setScene("battle");
      recordSeen(enemy.name);
      timerManager.setTimeout(() => { (window as typeof window & { __advancingFloor?: boolean }).__advancingFloor = false; }, 300);
    }, 800);
    return { triggered: true, shouldStopMoving: true };
  }

  // Normal area boss battle
  setShowStory("bossEncounter");
  timerManager.setTimeout(() => {
    const bossData = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName);
    if (bossData) {
      const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
      const enemy = { ...bossData };
      enemy.maxHP = Math.round(enemy.maxHP * dmul);
      enemy.hp = enemy.maxHP;
      enemy.atk = Math.round(enemy.atk * dmul);
      const baseSize = enemy.renderSize || 160;
      enemy.renderSize = Math.round(baseSize * 1.5);
      const lines = (enemy.name === '九尾の麒麟')
        ? getKirinIntroLines(((currentDex[enemy.name]?.seen || 0) + 1), 'boss', enemy)
        : [`${enemy.emoji} ${enemy.name} が あらわれた！`];

      const testMode = gameMode === 'library' ? (() => {
        if (player.currentArea === 9) {
          return { totalQuestions: 15, requiredCorrect: 10, questionsAsked: 0, correctAnswers: 0 };
        }
        if (player.currentArea === 8 || enemy.name === '麒麟') {
          return { totalQuestions: 10, requiredCorrect: 7, questionsAsked: 0, correctAnswers: 0 };
        }
        if (player.currentArea === 6) {
          return { totalQuestions: 10, requiredCorrect: 6, questionsAsked: 0, correctAnswers: 0 };
        }
        return { totalQuestions: 10, requiredCorrect: 6, questionsAsked: 0, correctAnswers: 0 };
      })() : undefined;

      setBattle(() => ({ enemy, log: [lines[0]], queue: lines.slice(1), mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 }, testMode }));
      setScene("battle");
      recordSeen(enemy.name);
    }
  }, 1200);
  return { triggered: true, shouldStopMoving: true };
}

// ─── handleTryMove ────────────────────────────────────────

export interface TryMoveDeps {
  timerManager: TimerManager;
  scene: Scene;
  player: Player;
  gameMode: GameMode;
  settings: Settings;
  currentMap: Tile[][];
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
  showTown: TownMenu | null;
  showMenu: boolean;
  showDex: boolean;
  showDojo: boolean;
  showSettings: boolean;
  showHowto: boolean;
  showStageSelect: boolean;
  showSaveMenu: boolean;
  showStory: string | null;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: Scene) => void;
  setShowStory: (story: string | null) => void;
  setShowTown: (menu: TownMenu | null) => void;
  setShowDojo: (show: boolean) => void;
  addToast: (msg: string) => void;
  recordSeen: (name: string) => void;
  startEncounter: (tile: Tile) => void;
  equipAccessory: (name: string) => void;
}

export function handleTryMove(dr: number, dc: number, deps: TryMoveDeps) {
  const {
    timerManager,
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
  } = deps;

  if (scene !== "map") {
    return;
  }
  const isAnyOverlayOpen = () => !!(showTown || showMenu || showDex || showDojo || showSettings || showHowto || showStageSelect || showSaveMenu || showStory);
  if (isAnyOverlayOpen()) {
    return;
  }

  const validation = validateMovement(player.pos, dr, dc, currentMap, settings.encounterRate);

  if (!validation.allowed) {
    return;
  }

  setPlayer(p => {
    const { newPos, tile, specialLocation, shouldEncounter } = validation;
    const nr = newPos.r;
    const nc = newPos.c;
    const moved: Player = { ...p, pos: { r: nr, c: nc } };

    const guardianEncountered = checkGuardianEncounter(p, newPos, {
      timerManager,
      settings,
      setPlayer,
      setBattle,
      setScene,
      setShowStory,
      addToast,
      recordSeen,
      equipAccessory
    });
    if (guardianEncountered) return moved;

    const bossEncounterResult = checkBossEncounter(p, newPos, {
      timerManager,
      gameMode,
      settings,
      currentAreaInfo,
      currentDex,
      setBattle,
      setScene,
      setShowStory,
      setPlayer,
      addToast,
      recordSeen
    });
    if (bossEncounterResult.shouldStopMoving) {
      return moved;
    }

    if (currentAreaInfo.dojoPos && isAtPosition({ r: nr, c: nc }, currentAreaInfo.dojoPos)) {
      setShowDojo(true);
      return moved;
    }

    if (specialLocation === 'town' || specialLocation === 'castle') {
      setShowTown("menu");
    } else if (shouldEncounter) {
      startEncounter(tile);
    }
    return moved;
  });
}

// ─── handleChangeStage ────────────────────────────────────

export interface ChangeStageDeps {
  player: Player;
  gameMode: GameMode;
  setPlayer: (updater: (p: Player) => Player) => void;
  setShowStageSelect: (show: boolean) => void;
  addToast: (msg: string) => void;
}

export function handleChangeStage(areaId: number, deps: ChangeStageDeps) {
  const { player, gameMode, setPlayer, setShowStageSelect, addToast } = deps;

  if (areaId === 10) {
    addToast(`⚠️ 無限の回廊へはステージ選択から移動できません`);
    return;
  }

  const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
  const targetArea = currentAreas.find(a => a.id === areaId);
  if (!targetArea) return;

  const isUnlocked = (
    areaId === 1 ||
    player.clearedAreas.includes(areaId - 1) ||
    (!!targetArea.optionalUnlockAfterAreaId && player.clearedAreas.includes(targetArea.optionalUnlockAfterAreaId))
  );
  if (!isUnlocked) {
    addToast(`🔒 このステージはまだ開放されていません`);
    return;
  }

  setPlayer(p => ({
    ...p,
    currentArea: areaId,
    pos: targetArea.startPos,
  }));
  setShowStageSelect(false);
  addToast(`📍 ${targetArea.name} へ移動しました`);
}

// ─── handleChangeFloor ────────────────────────────────────

export interface ChangeFloorDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  setShowStageSelect: (show: boolean) => void;
  addToast: (msg: string) => void;
}

export function handleChangeFloor(targetFloor: number, deps: ChangeFloorDeps) {
  const { player, setPlayer, setShowStageSelect, addToast } = deps;

  const maxFloor = player.endlessFloor || 1;
  if (targetFloor < 1 || targetFloor > maxFloor) {
    addToast(`🔒 第${targetFloor}階層にはまだ到達していません`);
    return;
  }

  if (targetFloor === player.endlessFloor) {
    setShowStageSelect(false);
    return;
  }

  setPlayer(p => ({
    ...p,
    endlessFloor: targetFloor
  }));
  setShowStageSelect(false);
  addToast(`📍 第${targetFloor}階層 へ移動しました`);
}

// ─── handleResetGame ──────────────────────────────────────

export interface ResetGameDeps {
  settings: Settings;
  setGameMode: (mode: GameMode) => void;
  setPlayer: (player: Player) => void;
  setBattle: (battle: BattleState | null) => void;
  setDexStory: (dex: DexData) => void;
  setDexEndless: (dex: DexData) => void;
  setEquipDex: (equipDex: EquipDexState) => void;
  setQuizCombo: (combo: number) => void;
  setEndlessRunBg: (bg: string | null) => void;
  addToast: (message: string) => void;
}

export function handleResetGame(
  areaId: number | undefined,
  mode: GameMode | undefined,
  deps: ResetGameDeps
): void {
  const {
    settings,
    setGameMode,
    setPlayer,
    setBattle,
    setDexStory,
    setDexEndless,
    setEquipDex,
    setQuizCombo,
    setEndlessRunBg,
    addToast
  } = deps;
  
  const targetMode: GameMode = mode || (areaId === 10 ? 'endless' : 'story');
  const isEndless = targetMode === 'endless';
  const isLibrary = targetMode === 'library';

  const currentAreas = isLibrary ? LIBRARY_AREAS : AREAS;

  const startArea = isEndless ? 10 : (areaId && currentAreas.find(a => a.id === areaId) ? areaId : 1);
  const areaInfo = isEndless
    ? { id: 10, ...ENDLESS_CONFIG, map: createRandomMap(1), bossDefeated: false, mainline: false } as AreaInfo
    : (currentAreas.find(a => a.id === startArea) || currentAreas[0]);
  
  setGameMode(targetMode);
  setPlayer({
    name: "ユウシャ",
    avatar: settings.avatar,
    lv: 1,
    exp: 0,
    gold: 40,
    maxHP: 40,
    hp: 40,
    maxMP: 12,
    mp: 12,
    baseATK: 3,
    baseDEF: 2,
    equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
    items: [{ ...TOOLS[0], qty: 2 }, { ...TOOLS[1], qty: 1 }],
    keyItems: [],
    pos: areaInfo.startPos,
    currentArea: startArea,
    clearedAreas: [],
    storyShownAreas: [],
    endlessFloor: isEndless ? 1 : undefined
  });
  setBattle(null);
  if (isEndless) {
    setDexEndless({});
    setEndlessRunBg(null);
  } else {
    setDexStory({});
  }
  setEquipDex({ weapons: [WEAPONS[0].name], armors: [ARMORS[0].name] });
  setQuizCombo(0);
  const toastMessage = isEndless
    ? "🌀 無限の回廊 開始"
    : isLibrary
    ? "📚 数の異世界 開始"
    : (startArea === 1 ? "はじめから" : `${areaInfo.name} から開始`);
  addToast(toastMessage);
}
