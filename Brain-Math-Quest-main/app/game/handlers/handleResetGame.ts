/**
 * Handle game reset
 * 
 * Handler for resetting the game to initial state.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

import { Player, GameMode, BattleState } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { DexData, EquipDexState } from '../types';
import { AreaInfo, AREAS, createRandomMap } from '../../lib/world/areas';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';
import { ENDLESS_CONFIG } from '../../lib/world/endless';
import { WEAPONS, ARMORS, TOOLS } from '../../lib/equipment';

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

/**
 * Reset game to initial state
 * 
 * @param areaId - Optional starting area ID
 * @param mode - Optional game mode (story or endless)
 * @param deps - Dependencies for game state management
 */
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
  
  // モード指定があればそれを使用、なければareaIdから判定
  const targetMode: GameMode = mode || (areaId === 10 ? 'endless' : 'story');
  const isEndless = targetMode === 'endless';
  const isLibrary = targetMode === 'library';

  // モードに応じて適切なエリアデータを選択
  const currentAreas = isLibrary ? LIBRARY_AREAS : AREAS;

  // Endlessモードの場合は仮想的な開始エリアを使用
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
    // リセット時もエリアの startPos から開始（道場重なり防止）
    pos: areaInfo.startPos,
    currentArea: startArea,
    clearedAreas: [],
    storyShownAreas: [],
    endlessFloor: isEndless ? 1 : undefined
  });
  setBattle(null);
  if (isEndless) {
    setDexEndless({});
    setEndlessRunBg(null); // Reset endless background for new run
  } else {
    setDexStory({});
  }
  // 装備図鑑を初期化して、スタート時の装備を登録
  setEquipDex({ weapons: [WEAPONS[0].name], armors: [ARMORS[0].name] });
  setQuizCombo(0);
  const toastMessage = isEndless
    ? "🌀 無限の回廊 開始"
    : isLibrary
    ? "📚 数の異世界 開始"
    : (startArea === 1 ? "はじめから" : `${areaInfo.name} から開始`);
  addToast(toastMessage);
}
