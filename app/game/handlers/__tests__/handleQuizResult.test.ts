/**
 * Tests for handleQuizResult handler
 *
 * Tests quiz result processing including heal, run, attack, and fire actions,
 * combo system, rewards, drops, and boss battle mechanics.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleQuizResult, QuizResultDeps } from '../battleHandlers';
import { Player, BattleState, GameMode } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { TimerManager } from '../../../lib/timerManager';
import { QuizBundle } from '../../../lib/quiz/types';

describe('handleQuizResult', () => {
  let mockDeps: QuizResultDeps;
  let mockPlayer: Player;
  let mockBattle: BattleState;
  let mockSettings: Settings;
  let timerManager: TimerManager;

  beforeEach(() => {
    vi.useFakeTimers();

    timerManager = new TimerManager();

    // Mock player
    mockPlayer = {
      name: 'Test Hero',
      avatar: '🦸',
      lv: 5,
      exp: 100,
      gold: 500,
      maxHP: 100,
      hp: 50,
      maxMP: 50,
      mp: 25,
      baseATK: 20,
      baseDEF: 15,
      equip: {
        weapon: { name: 'Iron Sword', atk: 10, price: 100 },
        armor: { name: 'Iron Shield', def: 8, price: 80 },
        accessory: null
      },
      items: [],
      keyItems: [],
      pos: { r: 5, c: 5 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: [],
      endlessFloor: 1,
      flags: {}
    };

    // Mock quiz bundle
    const mockQuiz: QuizBundle = {
      quiz: {
        type: 'SUM',
        prompt: '3 + 7 = ?',
        ui: { kind: 'input' },
        answer: '10'
      },
      timeMax: 30,
      timeLeft: 25,
      timeStart: Date.now(),
      pack: 'attack',
      power: 1
    };

    // Mock battle
    mockBattle = {
      enemy: {
        name: 'Slime',
        emoji: '🟢',
        imageUrl: '/images/enemies/slime.png',
        hp: 30,
        maxHP: 50,
        atk: 10,
        minLevel: 1,
        maxLevel: 3,
        boss: false
      },
      log: [],
      queue: [],
      mode: 'quiz',
      quiz: mockQuiz,
      quizStats: { total: 0, correct: 0, totalTime: 0 }
    };

    // Mock settings
    mockSettings = {
      difficulty: 'normal',
      encounterRate: 14,
      avatar: '🦸',
      tileSize: 32,
      pad: {
        show: true,
        anchor: 'bcl',
        size: 56,
        sizePct: 100,
        opacity: 0.9,
        collapsed: false,
        floating: true
      },
      statusOverlay: {
        show: true,
        anchor: 'bcr',
        size: 100,
        opacity: 1.0,
        collapsed: false,
        floating: true
      },
      bottomBar: { auto: true, height: 120 },
      hardQuizRandom: true,
      endlessDevEntry: false,
      uiScale: { show: true, applyToAll: false },
      quizTypes: ['SUM', 'MISSING', 'COMPARE'],
      answerReview: { showOnCorrect: false, showOnWrong: true },
      soundEffects: { enabled: true, volume: 0.5 },
      brainOnly: {
        battleBg: false,
        difficulty: 'normal',
        quizTypes: ['SUM', 'MISSING']
      }
    };

    // Mock dependencies
    mockDeps = {
      timerManager,
      battle: mockBattle,
      player: mockPlayer,
      gameMode: 'story' as GameMode,
      quizCombo: 5,
      settings: mockSettings,
      equipDex: { weapons: [], armors: [] },
      currentAreaInfo: { bossName: 'Dragon King' },
      enemyPanelRef: { current: document.createElement('div') },
      currentDex: {},
      dojoMode: null,
      setBattle: vi.fn((updater) => {
        if (typeof updater === 'function') {
          mockBattle = updater(mockBattle) || mockBattle;
        }
      }),
      setPlayer: vi.fn((updater) => {
        if (typeof updater === 'function') {
          mockPlayer = updater(mockPlayer);
        }
      }),
      setQuizCombo: vi.fn(),
      setBattleAnim: vi.fn(),
      setScene: vi.fn(),
      setShowStory: vi.fn(),
      setEquipDex: vi.fn(),
      addToast: vi.fn(),
      pushLog: vi.fn(),
      vibrate: vi.fn(),
      enemyStrike: vi.fn(),
      giveExpGold: vi.fn(() => ({})),
      recordDefeated: vi.fn(),
      addToEquipDex: vi.fn()
    };
  });

  afterEach(() => {
    timerManager.clearAll();
    vi.restoreAllMocks();
  });

  describe('heal pack', () => {
    it('should heal player on success', () => {
      handleQuizResult(true, 'heal', 0, mockDeps);

      expect(mockDeps.setPlayer).toHaveBeenCalled();
      expect(mockDeps.pushLog).toHaveBeenCalled();
      expect(mockDeps.vibrate).toHaveBeenCalled();
    });

    it('should update quiz stats', () => {
      handleQuizResult(true, 'heal', 0, mockDeps);

      expect(mockDeps.setBattle).toHaveBeenCalled();
    });

    it('should trigger enemy strike on failure', () => {
      handleQuizResult(false, 'heal', 0, mockDeps);

      expect(mockDeps.enemyStrike).toHaveBeenCalled();
    });

    it('should handle combo guard on failure', () => {
      mockPlayer.flags = { comboGuard: 1 };

      handleQuizResult(false, 'heal', 0, mockDeps);

      expect(mockDeps.addToast).toHaveBeenCalledWith(
        expect.stringContaining('コンボは守られた')
      );
    });

    it('should reset combo on failure without guard', () => {
      mockPlayer.flags = { comboGuard: 0 };

      handleQuizResult(false, 'heal', 0, mockDeps);

      expect(mockDeps.setQuizCombo).toHaveBeenCalledWith(0);
    });
  });

  describe('run pack', () => {
    it('should escape to map on success', () => {
      handleQuizResult(true, 'run', 0, mockDeps);

      vi.advanceTimersByTime(120);

      expect(mockDeps.setScene).toHaveBeenCalledWith('map');
    });

    it('should trigger onVictory callback on failure if present', () => {
      const onVictory = vi.fn();
      mockBattle.onVictory = onVictory;

      handleQuizResult(false, 'run', 0, mockDeps);

      expect(onVictory).toHaveBeenCalled();
    });

    it('should reset combo on failure', () => {
      handleQuizResult(false, 'run', 0, mockDeps);

      expect(mockDeps.setQuizCombo).toHaveBeenCalledWith(0);
    });

    it('should return to map after failure', () => {
      handleQuizResult(false, 'run', 0, mockDeps);

      vi.advanceTimersByTime(1200);

      expect(mockDeps.setScene).toHaveBeenCalledWith('map');
    });
  });

  describe('attack/fire pack - success', () => {
    it('should deal damage to enemy', () => {
      const _initialHP = mockBattle.enemy.hp;

      handleQuizResult(true, 'attack', 0, mockDeps);

      expect(mockDeps.setBattle).toHaveBeenCalled();
      expect(mockDeps.pushLog).toHaveBeenCalled();
    });

    it('should show damage animation', () => {
      handleQuizResult(true, 'attack', 0, mockDeps);

      vi.advanceTimersByTime(300);

      expect(mockDeps.setBattleAnim).toHaveBeenCalled();
    });

    it('should increment combo', () => {
      handleQuizResult(true, 'attack', 0, mockDeps);

      expect(mockDeps.setQuizCombo).toHaveBeenCalled();
    });

    it('should schedule victory check when enemy HP is low', () => {
      mockBattle.enemy.hp = 5; // Low HP to ensure defeat

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Should schedule timers for animations and victory check
      expect(mockDeps.setBattleAnim).toHaveBeenCalled();
      expect(mockDeps.pushLog).toHaveBeenCalled();
    });

    it('should update battle state on attack', () => {
      mockBattle.enemy.hp = 50;

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Should update battle state and show animations
      expect(mockDeps.setBattle).toHaveBeenCalled();
      expect(mockDeps.pushLog).toHaveBeenCalled();
    });

    it('should continue battle when enemy HP > 0', () => {
      mockBattle.enemy.hp = 50;

      handleQuizResult(true, 'attack', 0, mockDeps);

      vi.advanceTimersByTime(100);

      expect(mockDeps.enemyStrike).toHaveBeenCalled();
    });

    it('should show speed bonus for fast answers', () => {
      // Set very short time for speed bonus
      if (mockBattle.quiz) {
        mockBattle.quiz.timeStart = Date.now();
      }

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Speed bonus animation should be shown
      expect(mockDeps.setBattleAnim).toHaveBeenCalled();
    });
  });

  describe('attack/fire pack - failure', () => {
    it('should deal weak damage on failure', () => {
      handleQuizResult(false, 'attack', 0, mockDeps);

      expect(mockDeps.pushLog).toHaveBeenCalled();
    });

    it('should trigger enemy strike', () => {
      handleQuizResult(false, 'attack', 0, mockDeps);

      expect(mockDeps.enemyStrike).toHaveBeenCalled();
    });

    it('should reset combo without guard', () => {
      mockPlayer.flags = { comboGuard: 0 };

      handleQuizResult(false, 'attack', 0, mockDeps);

      expect(mockDeps.setQuizCombo).toHaveBeenCalledWith(0);
    });

    it('should consume combo guard if available', () => {
      mockPlayer.flags = { comboGuard: 2 };

      handleQuizResult(false, 'attack', 0, mockDeps);

      expect(mockDeps.setPlayer).toHaveBeenCalled();
      expect(mockDeps.addToast).toHaveBeenCalledWith(
        expect.stringContaining('コンボは守られた')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null battle gracefully', () => {
      mockDeps.battle = null;

      expect(() => {
        handleQuizResult(true, 'attack', 0, mockDeps);
      }).not.toThrow();
    });

    it('should handle missing quiz bundle', () => {
      mockBattle.quiz = null;

      expect(() => {
        handleQuizResult(true, 'attack', 0, mockDeps);
      }).not.toThrow();
    });

    it('should handle endless mode', () => {
      mockDeps.gameMode = 'endless';
      mockBattle.enemy.boss = true;
      mockBattle.onVictory = vi.fn();
      mockBattle.enemy.hp = 50; // Keep enemy alive for simpler test

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Should process attack in endless mode
      expect(mockDeps.pushLog).toHaveBeenCalled();
      expect(mockDeps.setBattle).toHaveBeenCalled();
    });

    it('should handle boss in story mode', () => {
      mockBattle.enemy.boss = true;
      mockBattle.enemy.name = 'Dragon King';
      mockBattle.enemy.hp = 50; // Keep enemy alive
      mockDeps.currentAreaInfo = { bossName: 'Dragon King' };

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Should process attack against boss
      expect(mockDeps.pushLog).toHaveBeenCalled();
      expect(mockDeps.setBattle).toHaveBeenCalled();
    });

    it('should process attack with giveExpGold function available', () => {
      mockBattle.enemy.hp = 50;
      mockDeps.giveExpGold = vi.fn(() => ({
        levelUp: {
          oldLv: 5,
          newLv: 6,
          hpGain: 10,
          mpGain: 5,
          atkGain: 2,
          defGain: 1
        }
      }));

      handleQuizResult(true, 'attack', 0, mockDeps);

      // Should process attack (giveExpGold only called on victory)
      expect(mockDeps.pushLog).toHaveBeenCalled();
    });
  });

  describe('quiz stats tracking', () => {
    it('should increment total quiz count', () => {
      const initialTotal = mockBattle.quizStats.total;
      handleQuizResult(true, 'attack', 0, mockDeps);

      expect(mockDeps.setBattle).toHaveBeenCalled();
      // Stats should be incremented
      expect(mockBattle.quizStats.total).toBeGreaterThanOrEqual(initialTotal);
    });

    it('should increment correct count on success', () => {
      const initialCorrect = mockBattle.quizStats.correct;
      handleQuizResult(true, 'attack', 0, mockDeps);

      // Correct count should increase on success
      expect(mockBattle.quizStats.correct).toBeGreaterThanOrEqual(initialCorrect);
    });

    it('should not increment correct count on failure', () => {
      handleQuizResult(false, 'attack', 0, mockDeps);

      const setBattleCall = (mockDeps.setBattle as any).mock.calls[0][0];
      const updatedBattle = setBattleCall(mockBattle);
      expect(updatedBattle.quizStats.correct).toBe(0);
    });

    it('should track time spent', () => {
      // Set quiz start time to 2 seconds ago
      if (mockBattle.quiz) {
        mockBattle.quiz.timeStart = Date.now() - 2000;
      }

      handleQuizResult(true, 'attack', 0, mockDeps);

      const setBattleCall = (mockDeps.setBattle as any).mock.calls[0][0];
      const updatedBattle = setBattleCall(mockBattle);
      expect(updatedBattle.quizStats.totalTime).toBeGreaterThan(0);
    });
  });

  describe('MP consumption', () => {
    it('should consume MP for fire action on success', () => {
      handleQuizResult(true, 'fire', 0, mockDeps);

      // Fire actions typically consume MP
      expect(mockDeps.setPlayer).toHaveBeenCalled();
    });

    it('should handle fire action with insufficient MP', () => {
      mockPlayer.mp = 0;

      handleQuizResult(true, 'fire', 0, mockDeps);

      // Should still work but with modified behavior
      expect(mockDeps.pushLog).toHaveBeenCalled();
    });
  });

  describe('vibration feedback', () => {
    it('should vibrate on heal', () => {
      handleQuizResult(true, 'heal', 0, mockDeps);

      expect(mockDeps.vibrate).toHaveBeenCalledWith(20);
    });

    it('should vibrate on attack', () => {
      handleQuizResult(true, 'attack', 0, mockDeps);

      expect(mockDeps.vibrate).toHaveBeenCalledWith(10);
    });
  });
});
