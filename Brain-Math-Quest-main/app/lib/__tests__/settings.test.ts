/**
 * Tests for Settings module
 * 
 * Tests the mergeSettings function which is critical for save compatibility.
 * Ensures settings from older versions are safely merged with new defaults.
 */

import { describe, it, expect } from 'vitest';
import { mergeSettings, isPadAnchor, PAD_ANCHORS } from '../settings';
import type { Settings, PadAnchor } from '../settings';

describe('Settings module', () => {
  describe('isPadAnchor', () => {
    it('should return true for valid anchors', () => {
      const validAnchors: PadAnchor[] = ["tl", "tr", "bl", "br", "tc", "bc", "tcl", "tcr", "bcl", "bcr"];
      validAnchors.forEach(anchor => {
        expect(isPadAnchor(anchor)).toBe(true);
      });
    });

    it('should return false for invalid values', () => {
      expect(isPadAnchor('invalid')).toBe(false);
      expect(isPadAnchor('')).toBe(false);
      expect(isPadAnchor(null)).toBe(false);
      expect(isPadAnchor(undefined)).toBe(false);
      expect(isPadAnchor(123)).toBe(false);
      expect(isPadAnchor({})).toBe(false);
    });

    it('should match PAD_ANCHORS constant', () => {
      PAD_ANCHORS.forEach(anchor => {
        expect(isPadAnchor(anchor)).toBe(true);
      });
    });
  });

  describe('mergeSettings - defaults', () => {
    it('should return default settings when no raw data provided', () => {
      const settings = mergeSettings({});
      
      expect(settings.difficulty).toBe('normal');
      expect(settings.encounterRate).toBe(14);
      expect(settings.avatar).toBe('🦸‍♀️');
      expect(settings.tileSize).toBe(32);
      expect(settings.hardQuizRandom).toBe(true);
      expect(settings.pad.show).toBe(true);
      expect(settings.pad.anchor).toBe('bcl');
      expect(settings.statusOverlay.show).toBe(true);
      expect(settings.statusOverlay.anchor).toBe('bcr');
    });

    it('should return default settings when undefined provided', () => {
      const settings = mergeSettings(undefined);
      expect(settings.difficulty).toBe('normal');
      expect(settings.tileSize).toBe(32);
    });

    it('should return default settings when null provided', () => {
      const settings = mergeSettings(null);
      expect(settings.difficulty).toBe('normal');
      expect(settings.tileSize).toBe(32);
    });
  });

  describe('mergeSettings - difficulty', () => {
    it('should accept valid difficulty values', () => {
      expect(mergeSettings({ difficulty: 'easy' }).difficulty).toBe('easy');
      expect(mergeSettings({ difficulty: 'normal' }).difficulty).toBe('normal');
      expect(mergeSettings({ difficulty: 'hard' }).difficulty).toBe('hard');
    });

    it('should default to normal when not provided or null/undefined', () => {
      expect(mergeSettings({ difficulty: null }).difficulty).toBe('normal');
      expect(mergeSettings({ difficulty: undefined }).difficulty).toBe('normal');
      expect(mergeSettings({}).difficulty).toBe('normal');
    });

    it('should pass through any provided difficulty value (no validation)', () => {
      // Implementation doesn't validate, just uses the value or defaults
      expect(mergeSettings({ difficulty: 'invalid' }).difficulty).toBe('invalid');
    });
  });

  describe('mergeSettings - encounterRate', () => {
    it('should use provided encounterRate', () => {
      expect(mergeSettings({ encounterRate: 20 }).encounterRate).toBe(20);
      expect(mergeSettings({ encounterRate: 0 }).encounterRate).toBe(0);
      expect(mergeSettings({ encounterRate: 100 }).encounterRate).toBe(100);
    });

    it('should default to 14 when not provided', () => {
      expect(mergeSettings({}).encounterRate).toBe(14);
    });
  });

  describe('mergeSettings - avatar', () => {
    it('should use provided avatar', () => {
      expect(mergeSettings({ avatar: '🦸' }).avatar).toBe('🦸');
      expect(mergeSettings({ avatar: '🧙' }).avatar).toBe('🧙');
    });

    it('should default to 🦸‍♀️ when not provided', () => {
      expect(mergeSettings({}).avatar).toBe('🦸‍♀️');
    });
  });

  describe('mergeSettings - tileSize', () => {
    it('should clamp tileSize to valid range [20, 64]', () => {
      expect(mergeSettings({ tileSize: 15 }).tileSize).toBe(20); // too small
      expect(mergeSettings({ tileSize: 32 }).tileSize).toBe(32); // valid
      expect(mergeSettings({ tileSize: 80 }).tileSize).toBe(64); // too large
    });

    it('should handle non-numeric tileSize values', () => {
      expect(mergeSettings({ tileSize: 'invalid' }).tileSize).toBe(32); // Number('invalid') = NaN
      expect(mergeSettings({ tileSize: null }).tileSize).toBe(20); // Number(null) = 0, clamped to 20
      expect(mergeSettings({ tileSize: NaN }).tileSize).toBe(32);
      expect(mergeSettings({ tileSize: Infinity }).tileSize).toBe(32);
    });

    it('should default to 32 when not provided', () => {
      expect(mergeSettings({}).tileSize).toBe(32);
    });
  });

  describe('mergeSettings - pad overlay', () => {
    it('should use default pad settings when not provided', () => {
      const settings = mergeSettings({});
      expect(settings.pad.show).toBe(true);
      expect(settings.pad.anchor).toBe('bcl');
      expect(settings.pad.size).toBe(56);
      expect(settings.pad.opacity).toBe(0.9);
      expect(settings.pad.collapsed).toBe(false);
      expect(settings.pad.floating).toBe(true);
    });

    it('should merge provided pad settings', () => {
      const settings = mergeSettings({
        pad: {
          show: false,
          anchor: 'tl',
          size: 80,
          opacity: 0.5
        }
      });
      expect(settings.pad.show).toBe(false);
      expect(settings.pad.anchor).toBe('tl');
      expect(settings.pad.size).toBe(80);
      expect(settings.pad.opacity).toBe(0.5);
    });

    it('should validate pad anchor and use default if invalid', () => {
      const settings = mergeSettings({
        pad: { anchor: 'invalid' as any }
      });
      expect(settings.pad.anchor).toBe('bcl');
    });

    it('should clamp pad sizePct to [40, 200]', () => {
      expect(mergeSettings({ pad: { sizePct: 30 } }).pad.sizePct).toBe(40);
      expect(mergeSettings({ pad: { sizePct: 100 } }).pad.sizePct).toBe(100);
      expect(mergeSettings({ pad: { sizePct: 250 } }).pad.sizePct).toBe(200);
    });

    it('should handle pad position', () => {
      const settings = mergeSettings({
        pad: { pos: { x: 100, y: 200 } }
      });
      expect(settings.pad.pos).toEqual({ x: 100, y: 200 });
    });

    it('should ignore invalid pad position', () => {
      const settings = mergeSettings({
        pad: { pos: { x: 'invalid', y: 'invalid' } }
      });
      expect(settings.pad.pos).toBeUndefined();
    });

    it('should preserve pad collapsed and floating flags', () => {
      const settings = mergeSettings({
        pad: { collapsed: true, floating: false }
      });
      expect(settings.pad.collapsed).toBe(true);
      expect(settings.pad.floating).toBe(false);
    });
  });

  describe('mergeSettings - statusOverlay', () => {
    it('should use default statusOverlay settings when not provided', () => {
      const settings = mergeSettings({});
      expect(settings.statusOverlay.show).toBe(true);
      expect(settings.statusOverlay.anchor).toBe('bcr');
      expect(settings.statusOverlay.size).toBe(100);
      expect(settings.statusOverlay.opacity).toBe(1.0);
      expect(settings.statusOverlay.collapsed).toBe(false);
      expect(settings.statusOverlay.floating).toBe(true);
    });

    it('should merge provided statusOverlay settings', () => {
      const settings = mergeSettings({
        statusOverlay: {
          show: false,
          anchor: 'tr',
          size: 120,
          opacity: 0.7
        }
      });
      expect(settings.statusOverlay.show).toBe(false);
      expect(settings.statusOverlay.anchor).toBe('tr');
      expect(settings.statusOverlay.size).toBe(120);
      expect(settings.statusOverlay.opacity).toBe(0.7);
    });

    it('should clamp statusOverlay size to [50, 150]', () => {
      expect(mergeSettings({ statusOverlay: { size: 30 } }).statusOverlay.size).toBe(50);
      expect(mergeSettings({ statusOverlay: { size: 100 } }).statusOverlay.size).toBe(100);
      expect(mergeSettings({ statusOverlay: { size: 200 } }).statusOverlay.size).toBe(150);
    });

    it('should clamp statusOverlay opacity to [0.4, 1.0]', () => {
      expect(mergeSettings({ statusOverlay: { opacity: 0.1 } }).statusOverlay.opacity).toBe(0.4);
      expect(mergeSettings({ statusOverlay: { opacity: 0.7 } }).statusOverlay.opacity).toBe(0.7);
      expect(mergeSettings({ statusOverlay: { opacity: 1.5 } }).statusOverlay.opacity).toBe(1.0);
    });

    it('should handle statusOverlay position', () => {
      const settings = mergeSettings({
        statusOverlay: { pos: { x: 300, y: 400 } }
      });
      expect(settings.statusOverlay.pos).toEqual({ x: 300, y: 400 });
    });
  });

  describe('mergeSettings - bottomBar', () => {
    it('should use default bottomBar settings when not provided', () => {
      const settings = mergeSettings({});
      expect(settings.bottomBar.auto).toBe(true);
      expect(settings.bottomBar.height).toBe(120);
    });

    it('should merge provided bottomBar settings', () => {
      const settings = mergeSettings({
        bottomBar: { auto: false, height: 150 }
      });
      expect(settings.bottomBar.auto).toBe(false);
      expect(settings.bottomBar.height).toBe(150);
    });

    it('should clamp bottomBar height to [80, 260]', () => {
      expect(mergeSettings({ bottomBar: { height: 50 } }).bottomBar.height).toBe(80);
      expect(mergeSettings({ bottomBar: { height: 150 } }).bottomBar.height).toBe(150);
      expect(mergeSettings({ bottomBar: { height: 300 } }).bottomBar.height).toBe(260);
    });

    it('should round bottomBar height to integer', () => {
      expect(mergeSettings({ bottomBar: { height: 125.7 } }).bottomBar.height).toBe(126);
    });

    it('should handle invalid bottomBar height', () => {
      expect(mergeSettings({ bottomBar: { height: NaN } }).bottomBar.height).toBe(120);
      expect(mergeSettings({ bottomBar: { height: Infinity } }).bottomBar.height).toBe(120);
    });
  });

  describe('mergeSettings - hardQuizRandom', () => {
    it('should default to true when not provided', () => {
      expect(mergeSettings({}).hardQuizRandom).toBe(true);
    });

    it('should use provided value', () => {
      expect(mergeSettings({ hardQuizRandom: false }).hardQuizRandom).toBe(false);
      expect(mergeSettings({ hardQuizRandom: true }).hardQuizRandom).toBe(true);
    });

    it('should default to true for non-boolean values', () => {
      expect(mergeSettings({ hardQuizRandom: 'yes' as any }).hardQuizRandom).toBe(true);
      expect(mergeSettings({ hardQuizRandom: null as any }).hardQuizRandom).toBe(true);
    });
  });

  describe('mergeSettings - endlessDevEntry', () => {
    it('should use provided value', () => {
      expect(mergeSettings({ endlessDevEntry: true }).endlessDevEntry).toBe(true);
      expect(mergeSettings({ endlessDevEntry: false }).endlessDevEntry).toBe(false);
    });

    it('should use ENDLESS_DEV_ENTRY_DEFAULT when not provided', () => {
      // Default is false per flags.ts
      const settings = mergeSettings({});
      expect(typeof settings.endlessDevEntry).toBe('boolean');
    });
  });

  describe('mergeSettings - uiScale', () => {
    it('should use default uiScale settings when not provided', () => {
      const settings = mergeSettings({});
      expect(settings.uiScale.show).toBe(true);
      expect(settings.uiScale.applyToAll).toBe(false);
    });

    it('should merge provided uiScale settings', () => {
      const settings = mergeSettings({
        uiScale: { show: false, applyToAll: true }
      });
      expect(settings.uiScale.show).toBe(false);
      expect(settings.uiScale.applyToAll).toBe(true);
    });
  });

  describe('mergeSettings - quizTypes', () => {
    it('should use default quiz types when not provided', () => {
      const settings = mergeSettings({});
      expect(Array.isArray(settings.quizTypes)).toBe(true);
      expect(settings.quizTypes.length).toBeGreaterThan(0);
      expect(settings.quizTypes).toContain('SUM');
      expect(settings.quizTypes).toContain('MISSING');
    });

    it('should use provided quiz types array', () => {
      const customTypes = ['SUM', 'COMPARE'];
      const settings = mergeSettings({ quizTypes: customTypes });
      expect(settings.quizTypes).toEqual(customTypes);
    });

    it('should use defaults if empty array provided', () => {
      const settings = mergeSettings({ quizTypes: [] });
      expect(settings.quizTypes.length).toBeGreaterThan(0);
    });

    it('should use defaults if non-array provided', () => {
      const settings = mergeSettings({ quizTypes: 'invalid' as any });
      expect(Array.isArray(settings.quizTypes)).toBe(true);
      expect(settings.quizTypes.length).toBeGreaterThan(0);
    });
  });

  describe('mergeSettings - brainOnly', () => {
    it('should use default brainOnly settings when not provided', () => {
      const settings = mergeSettings({});
      expect(settings.brainOnly.battleBg).toBe(false);
      expect(settings.brainOnly.difficulty).toBe('normal');
      expect(Array.isArray(settings.brainOnly.quizTypes)).toBe(true);
      expect(settings.brainOnly.quizTypes.length).toBeGreaterThan(0);
    });

    it('should merge provided brainOnly settings', () => {
      const settings = mergeSettings({
        brainOnly: {
          battleBg: true,
          difficulty: 'hard',
          quizTypes: ['SUM', 'MISSING']
        }
      });
      expect(settings.brainOnly.battleBg).toBe(true);
      expect(settings.brainOnly.difficulty).toBe('hard');
      expect(settings.brainOnly.quizTypes).toEqual(['SUM', 'MISSING']);
    });

    it('should inherit main difficulty for brainOnly if not specified', () => {
      const settings = mergeSettings({
        difficulty: 'easy',
        brainOnly: {}
      });
      expect(settings.brainOnly.difficulty).toBe('easy');
    });

    it('should use default quiz types for brainOnly if empty array', () => {
      const settings = mergeSettings({
        brainOnly: { quizTypes: [] }
      });
      expect(settings.brainOnly.quizTypes.length).toBeGreaterThan(0);
    });
  });

  describe('mergeSettings - complex scenarios', () => {
    it('should handle partial settings from old save format', () => {
      const oldSave = {
        difficulty: 'hard',
        tileSize: 40,
        pad: { show: true }
        // Missing many new fields
      };
      
      const settings = mergeSettings(oldSave);
      
      expect(settings.difficulty).toBe('hard');
      expect(settings.tileSize).toBe(40);
      expect(settings.pad.show).toBe(true);
      expect(settings.pad.anchor).toBe('bcl'); // default
      expect(settings.encounterRate).toBe(14); // default
      expect(settings.hardQuizRandom).toBe(true); // default
    });

    it('should handle complete settings roundtrip', () => {
      const original: Settings = mergeSettings({
        difficulty: 'hard',
        encounterRate: 20,
        avatar: '🧙',
        tileSize: 48,
        pad: {
          show: true,
          anchor: 'tr',
          size: 64,
          sizePct: 120,
          opacity: 0.8,
          pos: { x: 100, y: 200 },
          collapsed: true,
          floating: false
        },
        statusOverlay: {
          show: false,
          anchor: 'bl',
          size: 80,
          opacity: 0.6,
          pos: { x: 300, y: 400 },
          collapsed: false,
          floating: true
        },
        bottomBar: { auto: false, height: 180 },
        hardQuizRandom: false,
        endlessDevEntry: true,
        uiScale: { show: false, applyToAll: true },
        quizTypes: ['SUM', 'COMPARE'],
        brainOnly: {
          battleBg: true,
          difficulty: 'easy',
          quizTypes: ['MISSING']
        }
      });

      // Serialize and deserialize (simulating save/load)
      const serialized = JSON.parse(JSON.stringify(original));
      const restored = mergeSettings(serialized);

      expect(restored).toEqual(original);
    });

    it('should be idempotent', () => {
      const raw = { difficulty: 'hard', tileSize: 40 };
      const first = mergeSettings(raw);
      const second = mergeSettings(first);
      expect(first).toEqual(second);
    });
  });
});
