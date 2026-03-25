"use client";

/**
 * useGameState - Lightweight game state hook
 *
 * Goals (S10):
 * - Centralize game state transitions behind a small service-like API
 * - Keep UI components thin; delegate domain logic to existing lib modules
 * - Maintain current behavior (no breaking changes); this hook is additive
 */

import { useMemo, useRef, useState, useCallback } from 'react';
import type { Scene, GameMode, Player, BattleState, Difficulty } from '../lib/gameTypes';
import { AREAS, T, type Tile, type Vec } from '../lib/world/areas';
import { calculateNewPosition, isWalkable, shouldTriggerEncounter, getSpecialLocationType } from '../lib/world/movement';
import { shouldRollEncounter, pickEnemy, scaleEnemy } from '../lib/world/encounter';
import type { QuizBundle } from '../lib/quiz/types';
import { processAttackResult, processHealResult, processRunResult, calculateTimeBonus } from '../lib/quiz/engine';
import type { Settings } from '../lib/settings';
import { loadSave, createSaveData, findBestSaveSlot, saveToSlot, extractPlayerFromSave, extractGameModeFromSave } from '../lib/saveSystem';

export type GameState = {
  scene: Scene;
  mode: GameMode;
  player: Player;
  settings: Settings;
  areaId: number;
  map: Tile[][];
  quizCombo: number;
  battle: BattleState | null;
};

export type GameActions = {
  // map & movement
  moveBy: (dr: number, dc: number) => void;
  startEncounterAt: (pos: Vec) => void;
  setArea: (id: number) => void;
  // battle & quiz
  startQuiz: (quiz: QuizBundle) => void;
  resolveQuiz: (params: { ok: boolean; pack: 'attack' | 'fire' | 'heal' | 'run'; power: number; timeSpent: number; quiz: QuizBundle }) => void;
  // save/load
  quickSave: () => void;
  quickLoad: () => void;
};

export type UseGameState = {
  state: GameState;
  actions: GameActions;
};

export type UseGameStateOptions = {
  initialState?: Partial<GameState> & { player: Player; settings: Settings };
  rng?: () => number; // for tests
};

const defaultRng = () => Math.random();

function pickOne<T>(arr: T[], rng: () => number): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  const idx = Math.floor(rng() * arr.length);
  return arr[idx];
}

/**
 * Create initial battle state for an encounter
 */
function createBattleState(enemyName: string, enemy: NonNullable<ReturnType<typeof pickEnemy>>): BattleState {
  return {
    enemy,
    log: [`👾 ${enemyName} が あらわれた！`],
    queue: [],
    mode: 'select',
    quiz: null,
    rewards: null,
    quizStats: { total: 0, correct: 0, totalTime: 0 },
    onVictory: undefined,
  };
}

/**
 * Process quiz result based on pack type
 */
function processQuizByPack(
  ok: boolean,
  pack: 'attack' | 'fire' | 'heal' | 'run',
  ctx: Parameters<typeof processAttackResult>[2],
  timeSpent: number,
  difficulty: Difficulty
) {
  if (pack === 'heal') {
    return processHealResult(ok, ctx, timeSpent);
  }
  if (pack === 'run') {
    return processRunResult(ok, timeSpent, { difficulty }, false);
  }
  return processAttackResult(ok, pack, ctx, timeSpent);
}

/**
 * Apply outcome to enemy HP
 */
function applyEnemyDamage(
  enemy: BattleState['enemy'],
  outcome: ReturnType<typeof processAttackResult>
): BattleState['enemy'] {
  const nextEnemy = { ...enemy };
  if (typeof outcome.enemyDamage === 'number') {
    nextEnemy.hp = Math.max(0, nextEnemy.hp - outcome.enemyDamage);
  }
  return nextEnemy;
}

/**
 * Calculate player state updates from battle outcome
 */
function calculatePlayerUpdates(
  currentPlayer: Player,
  outcome: ReturnType<typeof processAttackResult>
) {
  const hpChange = typeof outcome.playerHPChange === 'number' ? outcome.playerHPChange : 0;
  const mpChange = typeof outcome.playerMPChange === 'number' ? outcome.playerMPChange : 0;

  return {
    hp: hpChange !== 0 ? Math.max(0, Math.min(currentPlayer.maxHP, currentPlayer.hp + hpChange)) : currentPlayer.hp,
    mp: mpChange !== 0 ? Math.max(0, Math.min(currentPlayer.maxMP, currentPlayer.mp + mpChange)) : currentPlayer.mp,
  };
}

/**
 * Calculate combo update from battle outcome
 */
function calculateComboUpdate(
  currentCombo: number,
  outcome: ReturnType<typeof processAttackResult>
): number {
  if (outcome.comboChange === 'reset') return 0;
  if (typeof outcome.comboChange === 'number') return currentCombo + outcome.comboChange;
  return currentCombo;
}

/**
 * Determine battle outcome state and rewards
 */
function determineBattleOutcome(
  battle: BattleState,
  enemyDefeated: boolean,
  timeSpent: number,
  difficulty: Difficulty
): { mode: BattleState['mode']; rewards: BattleState['rewards'] } {
  if (!enemyDefeated) {
    return { mode: 'select', rewards: battle.rewards ?? null };
  }

  const avgTime = battle.quizStats.total > 0
    ? battle.quizStats.totalTime / battle.quizStats.total
    : timeSpent;

  return {
    mode: 'victory',
    rewards: {
      exp: 0,
      gold: 0,
      timeBonus: calculateTimeBonus(avgTime, difficulty, !!battle.enemy.boss),
      items: undefined,
      levelUp: undefined,
      levelUpDetails: undefined
    }
  };
}

/**
 * Handle encounter trigger logic and return battle state if encounter occurs
 */
function handleEncounterCheck(
  tile: Tile,
  currentArea: number,
  encounterRate: number,
  difficulty: Difficulty,
  picker: <T>(arr: T[]) => T | undefined
): BattleState | null {
  const shouldEncounter = shouldRollEncounter(currentArea) && shouldTriggerEncounter(tile, encounterRate);
  if (!shouldEncounter) return null;

  const enemy = pickEnemy(currentArea, picker);
  if (!enemy) return null;

  const isDungeon = tile === T.Cave || tile === T.Castle;
  scaleEnemy(enemy, difficulty, isDungeon);
  return createBattleState(enemy.name, enemy);
}

/**
 * Get area information by ID
 */
function getAreaInfo(areaId: number) {
  const found = AREAS.find(a => a.id === areaId);
  return found !== undefined ? found : AREAS[0];
}

/**
 * Parse initial values with defaults
 */
function parseInitialValues(opts: UseGameStateOptions) {
  const state = opts.initialState;
  return {
    scene: state?.scene !== undefined ? state.scene : 'map' as Scene,
    mode: state?.mode !== undefined ? state.mode : 'story' as GameMode,
    quizCombo: state?.quizCombo !== undefined ? state.quizCombo : 0,
    battle: state?.battle !== undefined ? state.battle : null,
  };
}

/**
 * Initialize game state values from options
 */
function initializeGameValues(opts: UseGameStateOptions) {
  const rng = opts.rng !== undefined ? opts.rng : defaultRng;
  const initArea = opts.initialState?.areaId !== undefined ? opts.initialState.areaId : 1;
  const areaInfo = getAreaInfo(initArea);
  const initMap = opts.initialState?.map !== undefined ? opts.initialState.map : areaInfo.map;
  const parsed = parseInitialValues(opts);

  return {
    rng,
    initArea,
    areaInfo,
    initMap,
    ...parsed,
    player: opts.initialState!.player,
    settings: opts.initialState!.settings,
  };
}

export function useGameState(opts: UseGameStateOptions): UseGameState {
  const init = initializeGameValues(opts);
  const { rng, areaInfo, initMap } = init;
  const [scene, setScene] = useState<Scene>(init.scene);
  const [mode, setMode] = useState<GameMode>(init.mode);
  const [player, setPlayer] = useState<Player>(init.player);
  const [areaId, setAreaId] = useState<number>(areaInfo.id);
  const [map, setMap] = useState<Tile[][]>(initMap);
  const [quizCombo, setQuizCombo] = useState<number>(init.quizCombo);
  const [battle, setBattle] = useState<BattleState | null>(init.battle);
  const settingsRef = useRef<Settings>(init.settings);

  // Derived helpers (reserved for future use)
  const _tileAt = useCallback((pos: Vec): Tile => {
    const tile = map[pos.r]?.[pos.c];
    return tile !== undefined ? tile : T.Grass;
  }, [map]);

  const actions: GameActions = useMemo(() => ({
    setArea: (id: number) => {
      const next = AREAS.find(a => a.id === id);
      const area = next !== undefined ? next : AREAS[0];
      setAreaId(area.id);
      setMap(area.map);
      // keep player position clamped inside new map
      setPlayer(p => ({ ...p, pos: { r: Math.min(p.pos.r, area.map.length - 1), c: Math.min(p.pos.c, area.map[0].length - 1) }, currentArea: area.id }));
    },

    moveBy: (dr: number, dc: number) => {
      setPlayer(prev => {
        const nextPos = calculateNewPosition(prev.pos, dr, dc);
        const tileAt = map[nextPos.r]?.[nextPos.c];
        const t = tileAt !== undefined ? tileAt : T.Grass;

        // Cannot move into wall/water
        if (!isWalkable(t)) return prev;

        const moved: Player = { ...prev, pos: nextPos };

        // Special locations (town/castle) - handled by UI overlays
        getSpecialLocationType(t); // Called for side effects if any

        // Random encounter check
        const encounter = handleEncounterCheck(
          t,
          moved.currentArea,
          settingsRef.current.encounterRate,
          settingsRef.current.difficulty,
          (arr) => pickOne(arr, rng)
        );
        if (encounter) {
          setBattle(encounter);
          setScene('battle');
        }
        return moved;
      });
    },

    startEncounterAt: (pos: Vec) => {
      const tileAt = map[pos.r]?.[pos.c];
      const t = tileAt !== undefined ? tileAt : T.Grass;
      const enemy = pickEnemy(areaId, (arr) => pickOne(arr, rng));
      if (!enemy) return;

      const isDungeon = t === T.Cave || t === T.Castle;
      scaleEnemy(enemy, settingsRef.current.difficulty, isDungeon);
      setBattle(createBattleState(enemy.name, enemy));
      setScene('battle');
    },

    startQuiz: (quiz: QuizBundle) => {
      setBattle(b => {
        if (!b) return b;
        return { ...b, mode: 'quiz', quiz };
      });
    },

    resolveQuiz: ({ ok, pack, power: _power, timeSpent, quiz }: { ok: boolean; pack: 'attack' | 'fire' | 'heal' | 'run'; power: number; timeSpent: number; quiz: QuizBundle }) => {
      setBattle(prev => {
        if (!prev) return prev;

        // Build context and process quiz
        const ctx = {
          player,
          enemy: prev.enemy,
          quiz,
          quizCombo,
          settings: { difficulty: settingsRef.current.difficulty as Difficulty }
        } as const;
        const outcome = processQuizByPack(ok, pack, ctx, timeSpent, settingsRef.current.difficulty as Difficulty);

        // Apply damage to enemy
        const nextEnemy = applyEnemyDamage(prev.enemy, outcome);
        const enemyDefeated = outcome.enemyDefeated || nextEnemy.hp <= 0;

        // Update player state
        setPlayer(p => ({ ...p, ...calculatePlayerUpdates(p, outcome) }));

        // Update combo
        setQuizCombo(c => calculateComboUpdate(c, outcome));

        // Determine battle mode and rewards
        const nextLog = [...prev.log, ...outcome.messages];
        const battleOutcome = determineBattleOutcome(prev, enemyDefeated, timeSpent, settingsRef.current.difficulty as Difficulty);

        return { ...prev, enemy: nextEnemy, log: nextLog, ...battleOutcome };
      });
    },

    quickSave: () => {
      // Assemble SaveData using helper
      const s = createSaveData({
        player,
        settings: settingsRef.current,
        dexStory: {},
        dexEndless: {},
        equipDex: { weapons: [], armors: [] },
        quizCombo,
        playTime: 0,
        gameMode: mode,
      });
      const slot = findBestSaveSlot();
      saveToSlot(slot, s);
    },

    quickLoad: () => {
      const s = loadSave();
      if (!s) return;
      const loadedPlayer = extractPlayerFromSave(s);
      const loadedMode = extractGameModeFromSave(s);
      setPlayer(p => ({ ...p, ...loadedPlayer }));
      setMode(loadedMode);
    }
  }), [areaId, map, mode, player, quizCombo, rng]);

  return { state: { scene, mode, player, settings: settingsRef.current, areaId, map, quizCombo, battle }, actions };
}
