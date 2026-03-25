import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../hooks/useGameState';
import { AREAS } from '../lib/world/areas';
import type { Player } from '../lib/gameTypes';
import type { Settings } from '../lib/settings';

function makePlayer(): Player {
  return {
    name: '勇者',
    avatar: '🦸‍♀️',
    lv: 1,
    exp: 0,
    gold: 0,
    maxHP: 30,
    hp: 30,
    maxMP: 10,
    mp: 10,
    baseATK: 8,
    baseDEF: 4,
    equip: { weapon: { name: '木の棒', atk: 1, price: 0 }, armor: { name: '布の服', def: 1, price: 0 }, accessory: null },
    items: [],
    keyItems: [],
    pos: { r: 2, c: 2 },
    currentArea: 1,
    clearedAreas: [],
    storyShownAreas: [],
    endlessFloor: 1,
    flags: {},
  };
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    difficulty: 'normal',
    encounterRate: 14,
    avatar: '🦸‍♀️',
    tileSize: 32,
    pad: { show: true, anchor: 'bcl', size: 56, sizePct: 100, opacity: 0.9 },
    statusOverlay: { show: true, anchor: 'bcr', size: 100, opacity: 1.0 },
    bottomBar: { auto: true, height: 120 },
    hardQuizRandom: true,
    endlessDevEntry: false,
    uiScale: { show: true, applyToAll: false },
    quizTypes: ['SUM','MISSING','COMPARE','PAIR','ORDER','MAX_MIN','PAIR_DIFF','MAX_MIN_EXPR','ORDER_SUM','COMPARE_EXPR','RANGE_DIFF','MULTI_SELECT_MULTIPLES'],
    answerReview: { showOnCorrect: false, showOnWrong: true },
    soundEffects: { enabled: true, volume: 0.5 },
    brainOnly: { battleBg: false, difficulty: 'normal', quizTypes: ['SUM'] },
    ...overrides,
  };
}

describe('useGameState (S10 minimal)', () => {
  it('moves within bounds and blocks walls/water', () => {
    const area = AREAS[0];
    const player = makePlayer();
    const settings = makeSettings();
    const { result } = renderHook(() => useGameState({ initialState: { player, settings, areaId: area.id, map: area.map, scene: 'map', mode: 'story', quizCombo: 0 } }));

    // attempt to move into a wall at border (0,2) from (2,2) via dr=-2
    act(() => {
      result.current.actions.moveBy(-1, 0);
      result.current.actions.moveBy(-1, 0);
    });

    // should be at row 1 (border at row 0 is wall so cannot enter), not 0
    expect(result.current.state.player.pos.r).toBeGreaterThanOrEqual(1);

    // move right into grass
    const before = { ...result.current.state.player.pos };
    act(() => {
      result.current.actions.moveBy(0, 1);
    });
    expect(result.current.state.player.pos.c).toBe(before.c + 1);
  });

  it('triggers encounter when encounterRate is high', () => {
    const area = AREAS[0];
    const player = makePlayer();
    const settings = makeSettings({ encounterRate: 100 });
    const { result } = renderHook(() => useGameState({ initialState: { player, settings, areaId: area.id, map: area.map, scene: 'map', mode: 'story', quizCombo: 0 }, rng: () => 0.1 }));

    act(() => {
      result.current.actions.moveBy(0, 1);
    });

    expect(result.current.state.scene).toBe('battle');
    expect(result.current.state.battle).not.toBeNull();
  });

  it('applies quiz result to enemy HP and combo', () => {
    const area = AREAS[0];
    const player = makePlayer();
    const settings = makeSettings({ encounterRate: 0 });
    const { result } = renderHook(() => useGameState({ initialState: { player, settings, areaId: area.id, map: area.map, scene: 'map', mode: 'story', quizCombo: 0 }, rng: () => 0.5 }));

    // Force an encounter manually at current pos
    act(() => {
      result.current.actions.startEncounterAt(result.current.state.player.pos);
    });
    const _battle = result.current.state.battle!;
    // Minimal fake quiz bundle
    const quiz = { quiz: { type: 'SUM', prompt: '1+1?', choices: ['2'], answer: '2' }, pack: 'attack', power: 1 } as any;

    act(() => {
      result.current.actions.startQuiz(quiz);
    });

    const enemyHPBefore = result.current.state.battle!.enemy.hp;

    act(() => {
      result.current.actions.resolveQuiz({ ok: true, pack: 'attack', power: 1, timeSpent: 2, quiz });
    });

    const enemyHPAfter = result.current.state.battle!.enemy.hp;
    expect(enemyHPAfter).toBeLessThan(enemyHPBefore);
    expect(result.current.state.quizCombo).toBeGreaterThan(0);
  });
});
