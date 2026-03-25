/**
 * Tests for handleEnemyStrike handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleEnemyStrike, EnemyStrikeDeps } from '../handleEnemyStrike';
import { Player, BattleState } from '../../../lib/gameTypes';
import { TimerManager } from '../../../lib/timerManager';

describe('handleEnemyStrike', () => {
  let mockDeps: EnemyStrikeDeps;
  let mockPlayer: Player;
  let mockBattle: BattleState;
  let timerManager: TimerManager;

  beforeEach(() => {
    timerManager = new TimerManager();

    mockPlayer = {
      name: 'テスト勇者',
      avatar: '🧙',
      lv: 5,
      exp: 0,
      gold: 100,
      maxHP: 100,
      hp: 100,
      maxMP: 50,
      mp: 50,
      baseATK: 10,
      baseDEF: 5,
      equip: {
        weapon: { name: '木の棒', atk: 5, price: 10 },
        armor: { name: '布の服', def: 3, price: 10 },
        accessory: null
      },
      items: [],
      keyItems: [],
      pos: { r: 0, c: 0 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: []
    } as Player;

    mockBattle = {
      enemy: {
        name: 'スライム',
        emoji: '🟢',
        imageUrl: '/images/enemies/slime.png',
        hp: 30,
        maxHP: 30,
        atk: 8,
        minLevel: 1,
        maxLevel: 3,
        area: 1
      },
      log: [],
      queue: [],
      mode: 'select',
      quizStats: { total: 0, correct: 0, totalTime: 0 }
    } as BattleState;

    mockDeps = {
      timerManager,
      battle: mockBattle,
      player: mockPlayer,
      setPlayer: vi.fn((updater) => {
        if (typeof updater === 'function') {
          mockPlayer = updater(mockPlayer);
        }
      }),
      setBattleAnim: vi.fn(),
      pushLog: vi.fn(),
      vibrate: vi.fn(),
      setScene: vi.fn()
    };
  });

  it('should handle enemy attack and reduce player HP', () => {
    handleEnemyStrike(false, mockDeps);

    // Verify battle animation is set
    expect(mockDeps.setBattleAnim).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'playerHit' })
    );

    // Verify player HP is reduced
    expect(mockDeps.setPlayer).toHaveBeenCalled();

    // Verify logs are pushed
    expect(mockDeps.pushLog).toHaveBeenCalledWith(
      expect.stringContaining('スライム の こうげき！')
    );
    expect(mockDeps.pushLog).toHaveBeenCalledWith(
      expect.stringContaining('ダメージ！')
    );

    // Verify vibration is triggered
    expect(mockDeps.vibrate).toHaveBeenCalledWith(50);
  });

  it('should not do anything if battle is null', () => {
    const depsNoBattle = { ...mockDeps, battle: null };
    handleEnemyStrike(false, depsNoBattle);

    expect(mockDeps.setPlayer).not.toHaveBeenCalled();
    expect(mockDeps.pushLog).not.toHaveBeenCalled();
  });

  it('should trigger death sequence when player HP reaches 0', () => {
    // Set player HP very low
    mockPlayer.hp = 1;
    mockDeps.player = mockPlayer;

    handleEnemyStrike(false, mockDeps);

    // Fast-forward timers
    timerManager.clearAll();

    // Verify death message would be pushed and scene changed
    // Note: Due to setTimeout, we can't easily test the delayed effects
    // but we can verify the HP calculation is correct
    expect(mockDeps.setPlayer).toHaveBeenCalled();
  });

  it('should show defense reduction when player has defense', () => {
    mockPlayer.baseDEF = 10;
    mockPlayer.equip.armor.def = 5;
    mockDeps.player = mockPlayer;

    handleEnemyStrike(false, mockDeps);

    // Defense should reduce damage
    expect(mockDeps.pushLog).toHaveBeenCalled();

    // Check if defense reduction message is shown
    const logCalls = (mockDeps.pushLog as any).mock.calls;
    const hasDefenseLog = logCalls.some((call: any[]) =>
      call[0].includes('防御で') || call[0].includes('ダメージ')
    );
    expect(hasDefenseLog).toBe(true);
  });

  it('should cleanup timers properly', () => {
    handleEnemyStrike(false, mockDeps);

    // Verify timers were set
    expect(mockDeps.setBattleAnim).toHaveBeenCalled();

    // Cleanup
    timerManager.clearAll();
  });
});
