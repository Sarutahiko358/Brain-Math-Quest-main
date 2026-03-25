import { describe, it, expect } from 'vitest';
import { allGuardiansDefeated, canAccessBlessing, findGuardianAtPos, GUARDIANS } from '../../lib/world/guardians';

describe('guardians unlock', () => {
  it('should return false when no guardians defeated', () => {
    const flags = {
      genbuDefeated: false,
      seiryuDefeated: false,
      suzakuDefeated: false,
      byakkoDefeated: false
    };
    expect(allGuardiansDefeated(flags)).toBe(false);
    expect(canAccessBlessing(flags)).toBe(false);
  });

  it('should return false when some guardians defeated', () => {
    const flags = {
      genbuDefeated: true,
      seiryuDefeated: true,
      suzakuDefeated: false,
      byakkoDefeated: false
    };
    expect(allGuardiansDefeated(flags)).toBe(false);
    expect(canAccessBlessing(flags)).toBe(false);
  });

  it('should return true when all guardians defeated', () => {
    const flags = {
      genbuDefeated: true,
      seiryuDefeated: true,
      suzakuDefeated: true,
      byakkoDefeated: true
    };
    expect(allGuardiansDefeated(flags)).toBe(true);
    expect(canAccessBlessing(flags)).toBe(true);
  });
});

describe('findGuardianAtPos', () => {
  it('should find guardian at correct position when not defeated', () => {
    const flags = { genbuDefeated: false };
    const guardian = findGuardianAtPos(GUARDIANS.genbu.pos, flags);
    expect(guardian).not.toBeNull();
    expect(guardian?.name).toBe('玄武');
  });

  it('should return null when guardian already defeated', () => {
    const flags = { genbuDefeated: true };
    const guardian = findGuardianAtPos(GUARDIANS.genbu.pos, flags);
    expect(guardian).toBeNull();
  });

  it('should return null at non-guardian position', () => {
    const flags = {};
    const guardian = findGuardianAtPos({ r: 5, c: 5 }, flags);
    expect(guardian).toBeNull();
  });
});
