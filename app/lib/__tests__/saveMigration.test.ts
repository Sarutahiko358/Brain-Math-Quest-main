import { describe, it, expect } from 'vitest';
import { migrateSaveData } from '../saveMigration';

describe('saveMigration (simplified)', () => {
  it('passes through minimal valid shape', () => {
    const raw = { player: { name: '勇者' }, settings: {}, dex: {}, meta: { saveDate: Date.now(), playTime: 5, version: '1' } };
    const migrated = migrateSaveData(raw)!;
    expect(migrated.player.name).toBe('勇者');
    expect(migrated.meta.playTime).toBe(5);
  });

  it('fills defaults when fields missing', () => {
    const raw = { player: { name: 'X' } }; // 部分的
    const migrated = migrateSaveData(raw)!;
    expect(migrated.settings).toBeDefined();
    expect(migrated.dex).toBeDefined();
    expect(typeof migrated.meta.saveDate).toBe('number');
  });

  it('returns null on invalid input', () => {
    expect(migrateSaveData(null)).toBeNull();
    expect(migrateSaveData(undefined)).toBeNull();
  });

  it('keeps combo if present and numeric; defaults to 0 otherwise', () => {
    const withCombo = migrateSaveData({ player: {}, settings: {}, dex: {}, combo: 5, meta: { saveDate: 1, playTime: 0, version: '1' } })!;
    expect(withCombo.combo).toBe(5);

    const nonNumeric = migrateSaveData({ player: {}, settings: {}, dex: {}, combo: 'NaN', meta: { saveDate: 1, playTime: 0, version: '1' } })!;
    expect(nonNumeric.combo).toBe(0);

    const missing = migrateSaveData({ player: {}, settings: {}, dex: {}, meta: { saveDate: 1, playTime: 0, version: '1' } })!;
    expect(missing.combo).toBe(0);
  });
});
