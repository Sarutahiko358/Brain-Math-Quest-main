/**
 * Skills and Magic System
 */

/* -------------------- Constants -------------------- */

/**
 * All basic skills available in the game
 */
export const ALL_SKILLS = [
    { key: 'power-strike', name: '渾身斬り', rank: 1, type: 'skill', power: 1.3, mp: 0 },
    { key: 'double-slash', name: '二連斬り', rank: 2, type: 'skill', power: 1.6, mp: 0 },
    { key: 'meteor-strike', name: 'メテオ斬', rank: 3, type: 'skill', power: 2.1, mp: 0 },
    { key: 'fire', name: 'ファイア', rank: 1, type: 'fire', power: 1.5, mp: 4 },
    { key: 'flame', name: 'フレイム', rank: 2, type: 'fire', power: 1.9, mp: 6 },
    { key: 'inferno', name: 'インフェルノ', rank: 3, type: 'fire', power: 2.4, mp: 8 },
    { key: 'heal', name: 'ヒール', rank: 1, type: 'heal', power: 0, mp: 3 },
    { key: 'heal-more', name: 'ハイヒール', rank: 2, type: 'heal', power: 0, mp: 6 },
    { key: 'heal-all', name: 'ドハイヒール', rank: 3, type: 'heal', power: 0, mp: 9 },
];

/**
 * Ultimate skill unlocked after clearing optional stages
 */
export const ULTIMATE_SKILL = {
    key: 'ultimate-aurora',
    name: 'オーロラ・インパクト',
    rank: 3,
    type: 'skill',
    power: 3.2,
    mp: 0
};

/**
 * Ultimate magic unlocked after clearing optional stages
 */
export const ULTIMATE_MAGIC = {
    key: 'ultimate-cosmos',
    name: 'コスモフレア',
    rank: 3,
    type: 'fire',
    power: 3.0,
    mp: 10
};

/* -------------------- Helper Functions -------------------- */

/**
 * Helper function to add +N suffix to skill/equipment names
 */
export function ultimatePlusName(base, plus) {
    return (plus && plus > 0) ? `${base}+${plus}` : base;
}

/**
 * Calculate enhanced power for skills with + upgrades
 */
export function powerWithPlus(base, plus) {
    return base * (1 + Math.max(0, plus || 0) * 0.08);
}

/**
 * Filter skills by type
 */
function skillsByType(t) {
    return ALL_SKILLS.filter(s => s.type === t);
}

/**
 * Get learned skills based on player level
 */
export function learned(lv) {
    const rank = lv >= 10 ? 3 : lv >= 5 ? 2 : 1;
    const pickRank = (t) => skillsByType(t)
        .filter(s => s.rank <= rank)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, rank);
    return {
        skill: pickRank('skill'),
        fire: pickRank('fire'),
        heal: pickRank('heal')
    };
}

/**
 * Get learned skills including ultimate skills if unlocked
 */
export function learnedWithUltimate(
    lv,
    skillUnlocked,
    magicUnlocked,
    ultimateSkillPlus = 0,
    ultimateMagicPlus = 0
) {
    const base = learned(lv);
    const sPlus = ultimateSkillPlus;
    const mPlus = ultimateMagicPlus;
    const skillU = {
        ...ULTIMATE_SKILL,
        name: ultimatePlusName(ULTIMATE_SKILL.name, sPlus),
        power: powerWithPlus(ULTIMATE_SKILL.power, sPlus)
    };
    const magicU = {
        ...ULTIMATE_MAGIC,
        name: ultimatePlusName(ULTIMATE_MAGIC.name, mPlus),
        power: powerWithPlus(ULTIMATE_MAGIC.power, mPlus)
    };
    return {
        skill: skillUnlocked ? [...base.skill, skillU] : base.skill,
        fire: magicUnlocked ? [...base.fire, magicU] : base.fire,
        heal: base.heal,
    };
}
