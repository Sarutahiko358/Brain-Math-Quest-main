/**
 * Guardian encounter logic for Area 7 (Trial Tower)
 * Extracted from page.tsx for world module refactoring
 */

import { GUARDIANS_A7, Vec } from './areas';

export type GuardianId = 'genbu' | 'seiryu' | 'suzaku' | 'byakko';

export interface GuardianFlags {
  genbuDefeated?: boolean;
  seiryuDefeated?: boolean;
  suzakuDefeated?: boolean;
  byakkoDefeated?: boolean;
}

export interface GuardianInfo {
  id: GuardianId;
  name: string;
  pos: Vec;
  keyItem: string;
  defeatedFlag: keyof GuardianFlags;
}

export const GUARDIANS: Record<GuardianId, GuardianInfo> = {
  genbu: {
    id: 'genbu',
    name: '玄武',
    pos: GUARDIANS_A7.genbu,
    keyItem: '玄武の宝珠',
    defeatedFlag: 'genbuDefeated'
  },
  seiryu: {
    id: 'seiryu',
    name: '青龍',
    pos: GUARDIANS_A7.seiryu,
    keyItem: '青龍の宝玉',
    defeatedFlag: 'seiryuDefeated'
  },
  suzaku: {
    id: 'suzaku',
    name: '朱雀',
    pos: GUARDIANS_A7.suzaku,
    keyItem: '朱雀の炎石',
    defeatedFlag: 'suzakuDefeated'
  },
  byakko: {
    id: 'byakko',
    name: '白虎',
    pos: GUARDIANS_A7.byakko,
    keyItem: '白虎の牙',
    defeatedFlag: 'byakkoDefeated'
  }
};

/**
 * Check if all guardians have been defeated
 * @param flags - Guardian defeat flags
 * @returns true if all four guardians defeated
 */
export function allGuardiansDefeated(flags: GuardianFlags): boolean {
  return !!(flags.genbuDefeated && flags.seiryuDefeated && flags.suzakuDefeated && flags.byakkoDefeated);
}

/**
 * Find which guardian is at a given position, if any
 * @param pos - Position to check
 * @param flags - Guardian defeat flags
 * @returns Guardian info if found and not defeated, null otherwise
 */
export function findGuardianAtPos(pos: Vec, flags: GuardianFlags): GuardianInfo | null {
  for (const guardian of Object.values(GUARDIANS)) {
    if (pos.r === guardian.pos.r && pos.c === guardian.pos.c) {
      // Check if already defeated
      if (flags[guardian.defeatedFlag]) {
        return null;
      }
      return guardian;
    }
  }
  return null;
}

/**
 * Check if player can access the blessing (boss tile in area 7)
 * @param flags - Guardian defeat flags
 * @returns true if all guardians defeated and blessing accessible
 */
export function canAccessBlessing(flags: GuardianFlags): boolean {
  return allGuardiansDefeated(flags);
}
