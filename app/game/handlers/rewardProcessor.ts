/**
 * Reward Processor
 *
 * Handles battle rewards calculation and drop processing.
 * Extracted from handleQuizResult.ts to reduce complexity.
 */

import { Player, GameMode, BattleState } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { calculateTimeBonus, calculateRewards } from '../../lib/quiz/engine';
import { TOOLS, WEAPONS, ARMORS, ULTIMATE_WEAPON, ULTIMATE_ARMOR } from '../../lib/equipment';
import { pick, R } from '../../lib/rng';
import { ULTIMATE_SKILL, ULTIMATE_MAGIC, ultimatePlusName } from '../../lib/skills';
import { ultimateWeaponUpgraded, ultimateArmorUpgraded } from '../../lib/equipment';
import { LevelUpInfo, LevelUpDetail } from '../../lib/battle/flow';
import { EquipDexState } from '../types';

export interface RewardContext {
  player: Player;
  gameMode: GameMode;
  settings: Settings;
  equipDex: EquipDexState;
  battle: BattleState;
  hard: boolean;
}

export interface RewardDeps {
  setPlayer: (updater: (p: Player) => Player) => void;
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void;
  pushLog: (msg: string) => void;
  giveExpGold: (exp: number, gold: number) => { levelUp?: LevelUpInfo; details?: LevelUpDetail[] };
}

export interface RewardResult {
  exp: number;
  gold: number;
  timeBonus: number;
  extraGold: number;
  dropMessages: string[];
  levelUp?: LevelUpInfo;
  levelUpDetails?: LevelUpDetail[];
}

/**
 * Calculate strength index based on game mode and player progress
 */
function calculateStrengthIndex(player: Player, gameMode: GameMode): number {
  if (gameMode === 'endless') {
    const floor = player.endlessFloor || 1;
    return Math.max(1, Math.min(WEAPONS.length - 1, floor));
  }
  return Math.max(1, Math.min(WEAPONS.length - 1, player.currentArea + 1));
}

/**
 * Process tool drop (10% chance)
 */
function processToolDrop(
  setPlayer: (updater: (p: Player) => Player) => void,
  dropMessages: string[]
): void {
  if (Math.random() >= 0.1) return;

  const tool = pick(TOOLS);
  setPlayer((p) => {
    const items = [...p.items];
    const existingIndex = items.findIndex((it) => it.name === tool.name);

    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], qty: (items[existingIndex].qty || 0) + 1 };
    } else {
      items.push({ ...tool, qty: 1 });
    }

    return { ...p, items };
  });

  dropMessages.push(`🎁 ${tool.name} を ひろった！`);
}

/**
 * Process equipment drop with duplicate handling
 */
function processEquipmentDrop(
  equipmentType: 'weapon' | 'armor',
  dropRate: number,
  strengthIndex: number,
  player: Player,
  equipDex: EquipDexState,
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void,
  dropMessages: string[],
  extraGold: { value: number }
): void {
  if (Math.random() >= dropRate) return;

  const equipmentList = equipmentType === 'weapon' ? WEAPONS : ARMORS;
  const icon = equipmentType === 'weapon' ? '💎' : '💍';
  const candidate = equipmentList[Math.min(equipmentList.length - 1, strengthIndex + R(0, 1))];

  const currentEquipName = equipmentType === 'weapon' ? player.equip.weapon.name : player.equip.armor.name;
  const dexList = equipmentType === 'weapon' ? equipDex.weapons : equipDex.armors;
  const isOwned = currentEquipName === candidate.name || dexList.includes(candidate.name);

  if (isOwned) {
    const tradeValue = Math.floor(candidate.price / 2);
    extraGold.value += tradeValue;
    dropMessages.push(`${icon} ${candidate.name}（重複）→ 下取り +${tradeValue}G`);
  } else {
    addToEquipDex(equipmentType, candidate.name);
    dropMessages.push(`${icon} ${candidate.name} を 手に入れた！（装備図鑑に登録）`);
  }
}

/**
 * Calculate rewards and process drops from enemy defeat
 *
 * @param context - Battle and player context
 * @param deps - Dependencies for state updates
 * @returns Reward result with experience, gold, and drops
 */
export function processVictoryRewards(context: RewardContext, deps: RewardDeps): RewardResult {
  const { player, gameMode, settings, equipDex, battle, hard } = context;
  const { setPlayer, addToEquipDex, pushLog, giveExpGold } = deps;

  // Calculate base rewards
  const stats = battle.quizStats;
  const avgTime = stats.total > 0 ? stats.totalTime / stats.total : 999;
  const timeBonus = calculateTimeBonus(avgTime, settings.difficulty, !!battle.enemy.boss);
  const rewards = calculateRewards(battle.enemy, timeBonus, hard);

  // Apply rewards messages
  rewards.breakdown.forEach((msg) => pushLog(msg));

  // Process drops
  const extraGoldRef = { value: 0 };
  const dropMessages: string[] = [];

  // Tool drop (10% chance)
  processToolDrop(setPlayer, dropMessages);

  // Equipment drops
  const strengthIndex = calculateStrengthIndex(player, gameMode);
  const equipmentDropRate = battle.enemy.boss ? 0.18 : 0.06;

  processEquipmentDrop('weapon', equipmentDropRate, strengthIndex, player, equipDex, addToEquipDex, dropMessages, extraGoldRef);
  processEquipmentDrop('armor', equipmentDropRate, strengthIndex, player, equipDex, addToEquipDex, dropMessages, extraGoldRef);

  // Ultimate equipment drops (endless mode floor 7+)
  if (gameMode === 'endless' && (player.endlessFloor || 1) >= 7) {
    processUltimateDrops(player, equipDex, battle, dropMessages, setPlayer, addToEquipDex);
  }

  // Push drop messages to log
  dropMessages.forEach((m) => pushLog(m));

  // Give experience and gold
  const result = giveExpGold(rewards.exp, rewards.gold + extraGoldRef.value);

  // Push reward summary to log
  pushLog(``);
  pushLog(`✨ 経験値 +${rewards.exp}${timeBonus > 0 ? ` (⚡速解き+${timeBonus})` : ''}`);
  pushLog(
    `💰 ゴールド +${rewards.gold}${timeBonus > 0 ? ` (⚡+${Math.floor(timeBonus * 0.8)})` : ''}${
      extraGoldRef.value > 0 ? ` / 下取り +${extraGoldRef.value}` : ''
    }`
  );
  if (timeBonus > 0) {
    pushLog(`⚡ タイムボーナス！ (平均 ${avgTime.toFixed(1)}秒)`);
  }

  return {
    exp: rewards.exp,
    gold: rewards.gold,
    timeBonus,
    extraGold: extraGoldRef.value,
    dropMessages,
    levelUp: result.levelUp,
    levelUpDetails: result.details
  };
}

type UltimateType = 'weapon' | 'armor' | 'skill' | 'magic';

/**
 * Mapping of ultimate types to their plus counter property names
 */
const ULTIMATE_PLUS_KEYS: Record<UltimateType, keyof NonNullable<Player['flags']>> = {
  weapon: 'ultimateWeaponPlus',
  armor: 'ultimateArmorPlus',
  skill: 'ultimateSkillPlus',
  magic: 'ultimateMagicPlus',
};

/**
 * Increment the plus counter for the specified ultimate type
 */
function incrementUltimatePlus(
  flags: Player['flags'],
  kind: UltimateType
): Player['flags'] {
  const nextFlags = { ...flags };
  const key = ULTIMATE_PLUS_KEYS[kind];
  const currentValue = (flags?.[key] as number) || 0;
  (nextFlags as Record<string, number>)[key] = currentValue + 1;
  return nextFlags;
}

/**
 * Upgrade equipped ultimate items to their + versions
 */
function upgradeEquippedUltimateItems(
  equip: Player['equip'],
  flags: Player['flags']
): Player['equip'] {
  const nextEquip = { ...equip };

  if (nextEquip.weapon.name.startsWith(ULTIMATE_WEAPON.name)) {
    nextEquip.weapon = ultimateWeaponUpgraded(flags?.ultimateWeaponPlus || 0);
  }
  if (nextEquip.armor.name.startsWith(ULTIMATE_ARMOR.name)) {
    nextEquip.armor = ultimateArmorUpgraded(flags?.ultimateArmorPlus || 0);
  }

  return nextEquip;
}

/**
 * Award a plus upgrade to a random ultimate item
 */
function giveUltimatePlusUpgrade(
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  dropMessages: string[]
): void {
  const choices: UltimateType[] = ['weapon', 'armor', 'skill', 'magic'];
  const kind = choices[Math.floor(Math.random() * choices.length)];

  setPlayer((p) => {
    const flags = incrementUltimatePlus(p.flags, kind);
    const equip = upgradeEquippedUltimateItems(p.equip, flags);
    return { ...p, flags, equip };
  });

  const plusMsg = (label: string, n?: number) => `${label}${n && n > 0 ? `+${n}` : ''}`;
  const wP = (player.flags?.ultimateWeaponPlus || 0) + 1;
  const aP = (player.flags?.ultimateArmorPlus || 0) + 1;
  const sP = (player.flags?.ultimateSkillPlus || 0) + 1;
  const mP = (player.flags?.ultimateMagicPlus || 0) + 1;

  dropMessages.push(
    `✨ 究極の力が高まった！（${plusMsg('武器', wP)} / ${plusMsg('防具', aP)} / ${plusMsg('必殺', sP)} / ${plusMsg('魔法', mP)}）`
  );
}

/**
 * Award a specific ultimate item type to the player
 */
function giveUltimateItem(
  kind: 'weapon' | 'armor' | 'skill' | 'magic',
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void,
  dropMessages: string[]
): void {
  switch (kind) {
    case 'weapon':
      addToEquipDex('weapon', ULTIMATE_WEAPON.name);
      setPlayer((p) => {
        const plus = p.flags?.ultimateWeaponPlus || 0;
        const upgraded = ultimateWeaponUpgraded(plus);
        return { ...p, equip: { ...p.equip, weapon: upgraded } };
      });
      dropMessages.push(`🌟 ${ultimatePlusName(ULTIMATE_WEAPON.name, player.flags?.ultimateWeaponPlus)} を 手に入れた！`);
      break;

    case 'armor':
      addToEquipDex('armor', ULTIMATE_ARMOR.name);
      setPlayer((p) => {
        const plus = p.flags?.ultimateArmorPlus || 0;
        const upgraded = ultimateArmorUpgraded(plus);
        return { ...p, equip: { ...p.equip, armor: upgraded } };
      });
      dropMessages.push(`🌟 ${ultimatePlusName(ULTIMATE_ARMOR.name, player.flags?.ultimateArmorPlus)} を 手に入れた！`);
      break;

    case 'skill':
      setPlayer((p) => ({ ...p, flags: { ...(p.flags || {}), ultimateUnlocked: true } }));
      dropMessages.push(
        `🌟 究極の必殺技『${ultimatePlusName(ULTIMATE_SKILL.name, player.flags?.ultimateSkillPlus)}』を習得した！`
      );
      break;

    case 'magic':
      setPlayer((p) => ({ ...p, flags: { ...(p.flags || {}), ultimateMagicUnlocked: true } }));
      dropMessages.push(
        `🌟 究極の魔法『${ultimatePlusName(ULTIMATE_MAGIC.name, player.flags?.ultimateMagicPlus)}』を習得した！`
      );
      break;
  }
}

/**
 * Get list of ultimate items not yet obtained by player
 */
function getMissingUltimateItems(player: Player, equipDex: EquipDexState): Array<'weapon' | 'armor' | 'skill' | 'magic'> {
  const candidates: Array<'weapon' | 'armor' | 'skill' | 'magic'> = [];

  if (!equipDex.weapons.includes(ULTIMATE_WEAPON.name)) candidates.push('weapon');
  if (!equipDex.armors.includes(ULTIMATE_ARMOR.name)) candidates.push('armor');
  if (!player.flags?.ultimateUnlocked) candidates.push('skill');
  if (!player.flags?.ultimateMagicUnlocked) candidates.push('magic');

  return candidates;
}

/**
 * Process ultimate equipment drops for endless mode
 *
 * @param player - Current player state
 * @param equipDex - Equipment dex state
 * @param battle - Current battle state
 * @param dropMessages - Array to append drop messages
 * @param setPlayer - Function to update player state
 * @param addToEquipDex - Function to add equipment to dex
 */
function processUltimateDrops(
  player: Player,
  equipDex: EquipDexState,
  battle: BattleState,
  dropMessages: string[],
  setPlayer: (updater: (p: Player) => Player) => void,
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void
): void {
  const f = player.endlessFloor || 7;
  const isBoss = !!battle.enemy.boss && !!battle.onVictory;

  // Drop probability: boss 10% + 1.5%/floor (cap 40%), normal 2% + 0.5%/floor (cap 12%)
  const base = isBoss ? 0.1 : 0.02;
  const inc = isBoss ? 0.015 : 0.005;
  const cap = isBoss ? 0.4 : 0.12;
  const pUltimate = Math.min(cap, base + (f - 7) * inc);

  if (Math.random() >= pUltimate) return;

  const candidates = getMissingUltimateItems(player, equipDex);

  if (candidates.length > 0) {
    // Give one of the missing ultimate items
    const kind = candidates[Math.floor(Math.random() * candidates.length)];
    giveUltimateItem(kind, player, setPlayer, addToEquipDex, dropMessages);
  } else {
    // All 4 types already obtained: give + upgrade
    giveUltimatePlusUpgrade(player, setPlayer, dropMessages);
  }
}
