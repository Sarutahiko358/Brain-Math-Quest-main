/**
 * Skills and Magic System
 * 
 * This module defines all skills, magic spells, and related helper functions
 * for the battle system.
 */

/* -------------------- Types -------------------- */

export type Skill = {
  key: string;
  name: string;
  rank: 1 | 2 | 3;
  mp?: number;
  type: 'skill' | 'fire' | 'heal';
  power: number;
};

/* -------------------- Constants -------------------- */

/**
 * All basic skills available in the game
 * Each skill has a rank (1-3) and belongs to one of three types:
 * - skill: Physical attacks (no MP cost)
 * - fire: Offensive magic (MP cost)
 * - heal: Healing magic (MP cost)
 */
export const ALL_SKILLS: Skill[] = [
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
 * This is the most powerful physical skill in the game
 */
export const ULTIMATE_SKILL: Skill = {
  key: 'ultimate-aurora',
  name: 'オーロラ・インパクト',
  rank: 3,
  type: 'skill',
  power: 3.2,
  mp: 0
};

/**
 * Ultimate magic unlocked after clearing optional stages
 * This is the most powerful offensive spell in the game
 */
export const ULTIMATE_MAGIC: Skill = {
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
 * @param base Base name of the skill or equipment
 * @param plus Enhancement level (0 or undefined means no suffix)
 * @returns Name with +N suffix if plus > 0
 */
export function ultimatePlusName(base: string, plus?: number): string {
  return (plus && plus > 0) ? `${base}+${plus}` : base;
}

/**
 * Calculate enhanced power for skills with + upgrades
 * Each +1 adds 8% to the base power
 * @param base Base power value
 * @param plus Enhancement level
 * @returns Enhanced power value
 */
export function powerWithPlus(base: number, plus?: number): number {
  return base * (1 + Math.max(0, plus || 0) * 0.08);
}

/**
 * Filter skills by type
 * @param t Skill type to filter
 * @returns Array of skills of the specified type
 */
function skillsByType(t: Skill['type']): Skill[] {
  return ALL_SKILLS.filter(s => s.type === t);
}

/**
 * Get learned skills based on player level
 * - Level 1-4: Rank 1 skills (1 per type)
 * - Level 5-9: Rank 1-2 skills (2 per type)
 * - Level 10+: Rank 1-3 skills (3 per type)
 * @param lv Player level
 * @returns Object with arrays of learned skills by type
 */
export function learned(lv: number): { skill: Skill[]; fire: Skill[]; heal: Skill[] } {
  const rank = lv >= 10 ? 3 : lv >= 5 ? 2 : 1;
  const pickRank = (t: Skill['type']) => skillsByType(t)
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
 * Ultimate skills can be enhanced with + levels
 * Note: This function is a factory that creates the learnedWithUltimate function
 * with access to player flags for plus levels
 * @param lv Player level
 * @param skillUnlocked Whether ultimate skill is unlocked
 * @param magicUnlocked Whether ultimate magic is unlocked
 * @param ultimateSkillPlus Enhancement level for ultimate skill
 * @param ultimateMagicPlus Enhancement level for ultimate magic
 * @returns Object with arrays of learned skills by type, including ultimates
 */
export function learnedWithUltimate(
  lv: number,
  skillUnlocked: boolean | undefined,
  magicUnlocked: boolean | undefined,
  ultimateSkillPlus: number = 0,
  ultimateMagicPlus: number = 0
): { skill: Skill[]; fire: Skill[]; heal: Skill[] } {
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
