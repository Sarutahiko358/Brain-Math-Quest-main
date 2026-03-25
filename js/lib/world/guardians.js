/**
 * Guardian logic
 */

import { BOSS_POOL } from '../enemies.js';
import { GUARDIANS_A7 } from './areas.js';

export const GUARDIAN_NAMES = {
    GENBU: '玄武',
    SEIRYU: '青龍',
    SUZAKU: '朱雀',
    BYAKKO: '白虎',
};

export const GUARDIAN_REWARDS = {
    GENBU: '守護の黒水鉱',
    SEIRYU: '繁盛の青木宝',
    SUZAKU: '隆盛の朱火玉',
    BYAKKO: '繁栄の白金石',
};

export const GUARDIANS = {
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

export function scaleGuardianStats(enemy, difficulty) {
    const dmul = difficulty === "easy" ? 0.9 : difficulty === "hard" ? 1.25 : 1.0;
    const maxHP = Math.round(enemy.maxHP * dmul);
    const hp = maxHP;
    const atk = Math.round(enemy.atk * dmul);
    const baseSize = enemy.renderSize || 160;
    const renderSize = Math.round(baseSize * 1.5);

    return { maxHP, hp, atk, renderSize };
}

export function prepareGuardianEnemy(guardianName, difficulty) {
    const boss = BOSS_POOL.find(b => b.name === guardianName);
    if (!boss) return null;

    const enemy = { ...boss };
    const scaled = scaleGuardianStats(enemy, difficulty);

    enemy.maxHP = scaled.maxHP;
    enemy.hp = scaled.hp;
    enemy.atk = scaled.atk;
    enemy.renderSize = scaled.renderSize;

    return enemy;
}

export function getGuardianReward(guardianName) {
    switch (guardianName) {
        case GUARDIAN_NAMES.GENBU:
            return GUARDIAN_REWARDS.GENBU;
        case GUARDIAN_NAMES.SEIRYU:
            return GUARDIAN_REWARDS.SEIRYU;
        case GUARDIAN_NAMES.SUZAKU:
            return GUARDIAN_REWARDS.SUZAKU;
        case GUARDIAN_NAMES.BYAKKO:
            return GUARDIAN_REWARDS.BYAKKO;
        default:
            return null;
    }
}

export function allGuardiansDefeated(flags) {
    return !!(
        flags.genbuDefeated &&
        flags.seiryuDefeated &&
        flags.suzakuDefeated &&
        flags.byakkoDefeated
    );
}

export function findGuardianAtPos(pos, flags) {
    for (const guardian of Object.values(GUARDIANS)) {
        if (pos.r === guardian.pos.r && pos.c === guardian.pos.c) {
            if (flags[guardian.defeatedFlag]) {
                return null;
            }
            return guardian;
        }
    }
    return null;
}

export function canAccessBlessing(flags) {
    return allGuardiansDefeated(flags);
}
