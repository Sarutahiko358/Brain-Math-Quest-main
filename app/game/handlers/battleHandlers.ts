/**
 * Battle Handlers (consolidated)
 *
 * Combines all battle-related handlers into a single module:
 * - battleAnimations (animation scheduling)
 * - comboManager (combo guard / reset)
 * - levelUpProcessor (level-up display)
 * - rewardProcessor (victory rewards / drops)
 * - bossVictoryProcessor (boss victory / Four Sacred Beasts)
 * - handleBattleItemUse (item use during battle)
 * - handleBattleLog (battle log UI)
 * - handleEnemyStrike (enemy attack)
 * - handleSkillOrMagic (skill/magic activation)
 * - handleStartBrainQuiz (quiz initialization)
 * - handleStartEncounter (encounter initialization)
 * - handleQuizResult (quiz result processing)
 * - handleExpGoldReward (exp/gold rewards)
 * - actionHandlers (re-exports)
 * - actions/attackActionHandler
 * - actions/healActionHandler
 * - actions/runActionHandler
 */

// ─── Imports ────────────────────────────────────────────────────────────────

import { Player, BattleState, Scene, GameMode, Weapon, Armor, Tool } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { BattleAnimState, DexData, EquipDexState, DojoMode, LevelUpDialogState } from '../types';
import { LevelUpInfo, LevelUpDetail, applyExpGold } from '../../lib/battle/flow';
import { TimerManager } from '../../lib/timerManager';
import { UI_TIMINGS } from '../../lib/ui/constants';
import { effDEF } from '../../lib/battle/stats';
import { calculateEnemyDamage, processAttackResult, processHealResult, processRunResult, calculateTimeBonus, calculateRewards } from '../../lib/quiz/engine';
import { makeQuizPack } from '../../lib/quiz/generators';
import { isHardQuiz } from '../../lib/quiz/difficulty';
import { QuizType } from '../../lib/quiz/types';
import { getLibraryBossQuizTypes } from '../../lib/quiz/bossMappings';
import { Tile } from '../../lib/world/areas';
import { prepareEncounter } from '../../lib/world/encounterAdapter';
import { getEncounterIntroLines } from '../../lib/world/bossEncounter';
import { ULTIMATE_WEAPON, ULTIMATE_ARMOR, ACC_BY_NAME, TOOLS, WEAPONS, ARMORS, ultimateWeaponUpgraded, ultimateArmorUpgraded } from '../../lib/equipment';
import { ULTIMATE_SKILL, ULTIMATE_MAGIC, powerWithPlus, ultimatePlusName } from '../../lib/skills';
import { clamp } from '../../lib/uiLayout';
import { pick, R } from '../../lib/rng';
import { playSoundEffect } from './handleSoundEffects';

// ─── battleAnimations ───────────────────────────────────────────────────────

export interface AnimationDeps {
  setBattleAnim: (anim: BattleAnimState | null) => void;
  timerManager: TimerManager;
  vibrate: (ms: number) => void;
}

/**
 * Generic animation player
 * Consolidates common animation pattern: show animation -> wait -> clear
 *
 * @param type - Animation type
 * @param duration - Duration in milliseconds
 * @param deps - Animation dependencies
 * @param value - Optional animation value
 * @param vibrateMs - Optional vibration duration
 */
export function playAnimation(
  type: string,
  duration: number,
  deps: AnimationDeps,
  value?: number,
  vibrateMs?: number
): void {
  const { setBattleAnim, timerManager, vibrate } = deps;

  setBattleAnim({ type, value });
  timerManager.setTimeout(() => setBattleAnim(null), duration);

  if (vibrateMs !== undefined) {
    vibrate(vibrateMs);
  }
}

/**
 * Show heal animation
 *
 * @param healAmount - Amount of HP healed
 * @param deps - Animation dependencies
 */
export function showHealAnimation(healAmount: number, deps: AnimationDeps): void {
  playAnimation('heal', 1400, deps, healAmount, 20);
}

/**
 * Show speed bonus animation
 *
 * @param deps - Animation dependencies
 */
export function showSpeedBonusAnimation(deps: AnimationDeps): void {
  playAnimation('bonusSpeed', 900, deps);
}

/**
 * Show hard quiz bonus animation
 *
 * @param deps - Animation dependencies
 */
export function showHardBonusAnimation(deps: AnimationDeps): void {
  playAnimation('bonusHard', 900, deps);
}

/**
 * Show damage animation with optional combo bonus and scroll
 *
 * @param damage - Damage amount
 * @param isComboBonus - Whether this is a combo bonus attack
 * @param enemyPanelRef - Reference to enemy panel for scrolling
 * @param deps - Animation dependencies
 */
export function showDamageAnimation(
  damage: number,
  isComboBonus: boolean,
  enemyPanelRef: React.RefObject<HTMLDivElement | null>,
  deps: AnimationDeps
): void {
  const { setBattleAnim, timerManager, vibrate } = deps;

  // Scroll to enemy panel
  try {
    enemyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    // scrollIntoView may fail in some browsers or environments - safe to ignore
  }

  const scrollDelay = UI_TIMINGS.BATTLE_SCROLL_DELAY;
  const extraPause = UI_TIMINGS.BATTLE_EXTRA_PAUSE;

  // Schedule damage animation after scroll
  timerManager.setTimeout(() => {
    const animType = isComboBonus ? 'bonusCombo' : 'damage';
    setBattleAnim({ type: animType, value: damage });
    timerManager.setTimeout(() => setBattleAnim(null), 1400);
  }, scrollDelay + extraPause);

  vibrate(10);
}

/**
 * Show weak damage animation (for failed attacks)
 *
 * @param damage - Damage amount
 * @param deps - Animation dependencies
 */
export function showWeakDamageAnimation(damage: number, deps: AnimationDeps): void {
  playAnimation('damage', 1400, deps, damage);
}

/**
 * Show bonus animations based on quiz outcome
 *
 * @param speedBonus - Whether speed bonus was achieved
 * @param hardBonus - Whether hard quiz bonus was achieved
 * @param deps - Animation dependencies
 */
export function showBonusAnimations(
  speedBonus: boolean,
  hardBonus: boolean,
  deps: AnimationDeps
): void {
  if (speedBonus) {
    showSpeedBonusAnimation(deps);
  }
  if (hardBonus) {
    showHardBonusAnimation(deps);
  }
}

// ─── comboManager ───────────────────────────────────────────────────────────

export interface ComboGuardResult {
  shouldResetCombo: boolean;
  comboGuardConsumed: boolean;
  remainingGuards: number;
  toastMessage: string | null;
}

/**
 * Check if combo should be reset or protected by combo guard
 *
 * @param player - Current player state
 * @returns Result indicating whether combo should reset and guard status
 */
export function checkComboGuard(player: Player): ComboGuardResult {
  const comboGuardCount = player.flags?.comboGuard || 0;
  const hasGuard = comboGuardCount > 0;

  if (hasGuard) {
    const remainingGuards = Math.max(0, comboGuardCount - 1);
    return {
      shouldResetCombo: false,
      comboGuardConsumed: true,
      remainingGuards,
      toastMessage: `🛡 コンボは守られた！（残り${remainingGuards}）`
    };
  } else {
    return {
      shouldResetCombo: true,
      comboGuardConsumed: false,
      remainingGuards: 0,
      toastMessage: null
    };
  }
}

/**
 * Apply combo guard consumption to player state
 *
 * @param player - Current player state
 * @param setPlayer - Function to update player state
 * @param setQuizCombo - Function to update combo count
 * @param addToast - Function to show toast message
 */
export function applyComboGuardOrReset(
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  setQuizCombo: (updater: ((c: number) => number) | number) => void,
  addToast: (msg: string) => void
): void {
  const result = checkComboGuard(player);

  if (result.comboGuardConsumed) {
    // Consume combo guard
    setPlayer((p) => ({
      ...p,
      flags: { ...(p.flags || {}), comboGuard: result.remainingGuards }
    }));
    if (result.toastMessage) {
      addToast(result.toastMessage);
    }
  } else if (result.shouldResetCombo) {
    // Reset combo
    setQuizCombo(0);
  }
}

/**
 * Update combo count (for successful actions)
 *
 * @param comboChange - Amount to change combo by
 * @param setQuizCombo - Function to update combo count
 */
export function updateCombo(
  comboChange: number,
  setQuizCombo: (updater: ((c: number) => number) | number) => void
): void {
  setQuizCombo((c) => c + comboChange);
}

/**
 * Process combo change from quiz outcome
 * Handles both numeric changes (increment) and reset requests
 *
 * @param comboChange - Combo change from outcome ('reset' or number)
 * @param player - Current player state
 * @param setPlayer - Function to update player state
 * @param setQuizCombo - Function to update combo count
 * @param addToast - Function to show toast message
 */
export function processComboChange(
  comboChange: 'reset' | number | undefined,
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  setQuizCombo: (updater: ((c: number) => number) | number) => void,
  addToast: (msg: string) => void
): void {
  if (comboChange === 'reset') {
    applyComboGuardOrReset(player, setPlayer, setQuizCombo, addToast);
  } else if (typeof comboChange === 'number') {
    updateCombo(comboChange, setQuizCombo);
  }
  // If undefined, no combo change
}

// ─── levelUpProcessor ───────────────────────────────────────────────────────

export interface LevelUpResult {
  messages: string[];
  queueEntries: string[];
}

/**
 * Process level-up information and generate display messages
 *
 * @param levelUpInfo - Level-up information from giveExpGold
 * @param details - Detailed level-up breakdown per level
 * @returns Messages and queue entries for battle log
 */
export function processLevelUpDisplay(
  levelUpInfo: LevelUpInfo | undefined,
  details: LevelUpDetail[] | undefined
): LevelUpResult {
  const messages: string[] = [];
  const queueEntries: string[] = [];

  if (!levelUpInfo) {
    return { messages, queueEntries };
  }

  // Add level-up announcement
  messages.push('');
  messages.push(
    `🎉 レベルアップ！ Lv${levelUpInfo.oldLv} → Lv${levelUpInfo.newLv}`
  );

  // Generate detailed breakdown for queue
  if (details && details.length > 0) {
    details.forEach((d) => {
      const entry = `  └ Lv${d.fromLv} → Lv${d.toLv}：HP +${d.hp} / MP +${d.mp} / ATK +${d.atk} / DEF +${d.def}`;
      queueEntries.push(entry);
    });
  }

  return { messages, queueEntries };
}

/**
 * Apply level-up messages and queue entries to battle state
 *
 * @param battle - Current battle state
 * @param result - Level-up processing result
 * @param pushLog - Function to push messages to battle log
 * @param setBattle - Function to update battle state
 */
export function applyLevelUpDisplay(
  battle: BattleState | null,
  result: LevelUpResult,
  pushLog: (msg: string) => void,
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void
): void {
  // Push messages to log
  result.messages.forEach((msg) => pushLog(msg));

  // Add queue entries to battle state
  if (result.queueEntries.length > 0 && battle) {
    setBattle((b) =>
      b
        ? {
            ...b,
            queue: [...b.queue, ...result.queueEntries]
          }
        : b
    );
  }
}

// ─── rewardProcessor ────────────────────────────────────────────────────────

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

// ─── bossVictoryProcessor ───────────────────────────────────────────────────

export interface BossVictoryContext {
  battle: BattleState;
  player: Player;
  gameMode: GameMode;
  equipDex: EquipDexState;
  currentAreaInfo: { bossName: string };
}

export interface BossVictoryDeps {
  setPlayer: (updater: (p: Player) => Player) => void;
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void;
  pushLog: (msg: string) => void;
  addToast: (msg: string) => void;
  setShowStory: (story: 'bossVictory' | 'bossEncounter' | null) => void;
  timerManager: TimerManager;
}

/**
 * Process boss victory rewards and story events
 *
 * @param context - Battle and player context
 * @param deps - Dependencies for state updates and UI
 */
export function processBossVictory(context: BossVictoryContext, deps: BossVictoryDeps): void {
  const { battle, player, gameMode, equipDex, currentAreaInfo } = context;
  const { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager } = deps;

  // Only process for story mode and library mode bosses
  if (
    !battle.enemy.boss ||
    (gameMode !== 'story' && gameMode !== 'library') ||
    (battle.enemy.name !== currentAreaInfo.bossName && player.currentArea !== 7)
  ) {
    return;
  }

  // Collect reward messages (determined inside setPlayer, displayed outside)
  const postRewardMsgs: string[] = [];

  setPlayer((p) => {
    if (p.currentArea !== 7) {
      // Regular area boss (not Four Sacred Beasts)
      let next = { ...p } as Player;

      // Nine-Tailed Qilin proof reward (key item) with auto-equip
      if (battle.enemy.name === '九尾の麒麟') {
        const proofName = '鎮静の黄土珠';
        const firstTime = !next.keyItems.includes(proofName);
        if (firstTime) next.keyItems = [...next.keyItems, proofName];
        const acc = ACC_BY_NAME[proofName];
        if (acc) next.equip = { ...next.equip, accessory: acc };
        if (firstTime) {
          postRewardMsgs.push(`📜 天地の理、今しずまる──汝の偉業により『${proofName}』を授ける。`);
        }
        postRewardMsgs.push(`💍 ${proofName} を 手に入れた！（認められた証／常時コンボ+10）`);
      }

      // Mark area as cleared
      if (!next.clearedAreas.includes(next.currentArea)) {
        next = { ...next, clearedAreas: [...next.clearedAreas, next.currentArea] };
      }

      return next;
    } else {
      // Area 7: Four Sacred Beasts rewards
      return processFourSacredBeastsRewards(p, battle, equipDex, postRewardMsgs, setEquipDex);
    }
  });

  // Display reward messages
  if (postRewardMsgs.length > 0) {
    postRewardMsgs.forEach((m) => {
      pushLog(m);
      addToast(m);
    });
  }

  // Show story dialog with timing
  scheduleStoryEvents(player, battle, timerManager, setShowStory, addToast);
}

/**
 * Sets the appropriate guardian defeated flag based on enemy name
 */
function setGuardianDefeatedFlag(player: Player, enemyName: string): Player {
  const next = { ...player, flags: { ...(player.flags || {}) } };

  if (enemyName === '玄武') next.flags!.genbuDefeated = true;
  if (enemyName === '青龍') next.flags!.seiryuDefeated = true;
  if (enemyName === '朱雀') next.flags!.suzakuDefeated = true;
  if (enemyName === '白虎') next.flags!.byakkoDefeated = true;

  return next;
}

/**
 * Checks if all four sacred beasts have been defeated
 */
function areAllBeastsDefeated(player: Player): boolean {
  return (
    !!player.flags!.genbuDefeated &&
    !!player.flags!.seiryuDefeated &&
    !!player.flags!.suzakuDefeated &&
    !!player.flags!.byakkoDefeated
  );
}

type BossRewardType = 'weapon' | 'armor' | 'skill' | 'magic';

/**
 * Calculates which ultimate rewards are not yet obtained
 */
function calculateRemainingRewards(
  player: Player,
  equipDex: EquipDexState
): BossRewardType[] {
  const remaining: BossRewardType[] = [];

  const haveWeapon = (equipDex.weapons || []).includes(ULTIMATE_WEAPON.name);
  const haveArmor = (equipDex.armors || []).includes(ULTIMATE_ARMOR.name);
  const haveSkill = !!player.flags!.ultimateUnlocked;
  const haveMagic = !!player.flags!.ultimateMagicUnlocked;

  if (!haveWeapon) remaining.push('weapon');
  if (!haveArmor) remaining.push('armor');
  if (!haveSkill) remaining.push('skill');
  if (!haveMagic) remaining.push('magic');

  return remaining;
}

/**
 * Check if ultimate weapon is already obtained
 */
function hasUltimateWeapon(player: Player, equipDex: EquipDexState): boolean {
  const inDex = (equipDex.weapons || []).includes(ULTIMATE_WEAPON.name);
  const equipped = player.equip?.weapon?.name === ULTIMATE_WEAPON.name;
  return inDex || equipped;
}

/**
 * Check if ultimate armor is already obtained
 */
function hasUltimateArmor(player: Player, equipDex: EquipDexState): boolean {
  const inDex = (equipDex.armors || []).includes(ULTIMATE_ARMOR.name);
  const equipped = player.equip?.armor?.name === ULTIMATE_ARMOR.name;
  return inDex || equipped;
}

/**
 * Checks if a specific reward is already obtained
 */
function hasBossReward(
  kind: BossRewardType,
  player: Player,
  equipDex: EquipDexState
): boolean {
  switch (kind) {
    case 'weapon':
      return hasUltimateWeapon(player, equipDex);
    case 'armor':
      return hasUltimateArmor(player, equipDex);
    case 'skill':
      return !!player.flags?.ultimateUnlocked;
    case 'magic':
      return !!player.flags?.ultimateMagicUnlocked;
    default:
      return false;
  }
}

/**
 * Gives a specific ultimate reward to the player
 */
function giveBossUltimateReward(
  player: Player,
  kind: BossRewardType,
  guardianName: string,
  withBless: boolean,
  postRewardMsgs: string[],
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void
): Player {
  let next = player;

  if (kind === 'weapon') {
    setEquipDex((ed) =>
      ed.weapons.includes(ULTIMATE_WEAPON.name)
        ? ed
        : { ...ed, weapons: [...ed.weapons, ULTIMATE_WEAPON.name] }
    );
    next = { ...next, equip: { ...next.equip, weapon: ULTIMATE_WEAPON } };
    if (withBless) postRewardMsgs.push(getBlessingMessage(guardianName, 'weapon'));
    postRewardMsgs.push(`⚔️✨ 【${ULTIMATE_WEAPON.name}】 を手に入れた！（ATK+26）`);
    postRewardMsgs.push(`   └→ 自動装備しました`);
  } else if (kind === 'armor') {
    setEquipDex((ed) =>
      ed.armors.includes(ULTIMATE_ARMOR.name)
        ? ed
        : { ...ed, armors: [...ed.armors, ULTIMATE_ARMOR.name] }
    );
    next = { ...next, equip: { ...next.equip, armor: ULTIMATE_ARMOR } };
    if (withBless) postRewardMsgs.push(getBlessingMessage(guardianName, 'armor'));
    postRewardMsgs.push(`🛡️✨ 【${ULTIMATE_ARMOR.name}】 を手に入れた！（DEF+24）`);
    postRewardMsgs.push(`   └→ 自動装備しました`);
  } else if (kind === 'skill') {
    next = { ...next, flags: { ...next.flags!, ultimateUnlocked: true } };
    if (withBless) postRewardMsgs.push(getBlessingMessage(guardianName, 'skill'));
    postRewardMsgs.push(`💥✨ 【${ULTIMATE_SKILL.name}】 を習得した！（威力3.2倍）`);
    postRewardMsgs.push(`   └→ バトルで使用可能になりました`);
  } else if (kind === 'magic') {
    next = { ...next, flags: { ...next.flags!, ultimateMagicUnlocked: true } };
    if (withBless) postRewardMsgs.push(getBlessingMessage(guardianName, 'magic'));
    postRewardMsgs.push(`🌌✨ 【${ULTIMATE_MAGIC.name}】 を習得した！（威力3.0倍・MP10）`);
    postRewardMsgs.push(`   └→ バトルで使用可能になりました`);
  }

  return next;
}

/**
 * Completes all missing ultimate rewards after all beasts defeated
 */
function completeAllRewards(
  player: Player,
  equipDex: EquipDexState,
  guardianName: string,
  postRewardMsgs: string[],
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void
): Player {
  let next = player;
  const allRewards: BossRewardType[] = ['weapon', 'armor', 'skill', 'magic'];

  for (const kind of allRewards) {
    if (!hasBossReward(kind, next, equipDex)) {
      next = giveBossUltimateReward(next, kind, guardianName, false, postRewardMsgs, setEquipDex);
    }
  }

  if (!next.clearedAreas.includes(7)) {
    next = { ...next, clearedAreas: [...next.clearedAreas, 7] };
  }

  return next;
}

/**
 * Count how many guardians have been defeated
 */
function countDefeatedGuardians(player: Player): number {
  let count = 0;
  if (player.flags?.genbuDefeated) count++;
  if (player.flags?.seiryuDefeated) count++;
  if (player.flags?.suzakuDefeated) count++;
  if (player.flags?.byakkoDefeated) count++;
  return count;
}

/**
 * Get reward type name in Japanese
 */
function getRewardTypeName(kind: BossRewardType): string {
  const names = {
    weapon: '最強武器',
    armor: '最強防具',
    skill: '究極必殺技',
    magic: '究極魔法'
  };
  return names[kind];
}

/**
 * Process Four Sacred Beasts rewards with reduced complexity
 */
function processFourSacredBeastsRewards(
  player: Player,
  battle: BattleState,
  equipDex: EquipDexState,
  postRewardMsgs: string[],
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void
): Player {
  let next = setGuardianDefeatedFlag(player, battle.enemy.name);
  const guardianName = battle.enemy.name;
  const defeatedCount = countDefeatedGuardians(next);

  // Progress message
  postRewardMsgs.push(`\n✨ 四聖獣討伐進捗: ${defeatedCount}/4 体撃破 ✨\n`);

  // Give one random reward from remaining items
  const remaining = calculateRemainingRewards(next, equipDex);
  if (remaining.length > 0) {
    const pickIndex = Math.floor(Math.random() * remaining.length);
    const rewardType = remaining[pickIndex];
    postRewardMsgs.push(`🎁 ${guardianName}の試練クリア報酬: ${getRewardTypeName(rewardType)}`);
    next = giveBossUltimateReward(next, rewardType, guardianName, true, postRewardMsgs, setEquipDex);
  }

  // After defeating all four beasts, complete any missing ultimate items
  const allDone = areAllBeastsDefeated(next);
  if (allDone) {
    postRewardMsgs.push(`\n🏆🏆🏆 四聖獣完全制覇！ 🏆🏆🏆`);
    postRewardMsgs.push(`すべての究極報酬が揃いました！\n`);
    next = completeAllRewards(next, equipDex, guardianName, postRewardMsgs, setEquipDex);
  } else {
    // Show remaining guardians
    const remainingGuardians: string[] = [];
    if (!next.flags?.genbuDefeated) remainingGuardians.push('玄武');
    if (!next.flags?.seiryuDefeated) remainingGuardians.push('青龍');
    if (!next.flags?.suzakuDefeated) remainingGuardians.push('朱雀');
    if (!next.flags?.byakkoDefeated) remainingGuardians.push('白虎');
    if (remainingGuardians.length > 0) {
      postRewardMsgs.push(`\n残りの試練: ${remainingGuardians.join('、')}`);
    }
  }

  return next;
}

/**
 * Get blessing message for guardian reward
 */
function getBlessingMessage(guardianName: string, kind: 'weapon' | 'armor' | 'skill' | 'magic'): string {
  const treasureMap: Record<string, string> = {
    青龍: '繁盛の青木宝',
    白虎: '繁栄の白金石',
    朱雀: '隆盛の朱火玉',
    玄武: '守護の黒水鉱'
  };
  const treasure = treasureMap[guardianName] || '宝';

  const kindMap: Record<string, string> = {
    weapon: '武器',
    armor: '防具',
    skill: '必殺技',
    magic: '魔法'
  };
  const k = kindMap[kind];

  const blessingMap: Record<string, string> = {
    玄武: `📜 大地は汝の胆力を認む──そなたに${k}と『${treasure}』を授けん。`,
    青龍: `📜 蒼流を制したる者よ──そなたに${k}と『${treasure}』を授けよう。`,
    朱雀: `📜 焔の試練を越えし勇気、見事──そなたに${k}と『${treasure}』を賜る。`,
    白虎: `📜 鋼の気魄、確かに見た──そなたに${k}と『${treasure}』を与える。`
  };

  return blessingMap[guardianName] || `📜 力を示した、そなたに${k}＋${treasure}を授けよう。`;
}

/**
 * Schedule story events and toasts with proper timing
 */
function scheduleStoryEvents(
  player: Player,
  battle: BattleState,
  timerManager: TimerManager,
  setShowStory: (story: 'bossVictory' | 'bossEncounter' | null) => void,
  addToast: (msg: string) => void
): void {
  // Check if all four beasts are defeated (for Area 7 story display)
  const defeatedName = battle.enemy.name;
  const f0 = player.flags || {};
  const f1 = {
    ...f0,
    genbuDefeated: f0.genbuDefeated || defeatedName === '玄武',
    seiryuDefeated: f0.seiryuDefeated || defeatedName === '青龍',
    suzakuDefeated: f0.suzakuDefeated || defeatedName === '朱雀',
    byakkoDefeated: f0.byakkoDefeated || defeatedName === '白虎'
  } as typeof f0;
  const allDoneLocal = !!f1.genbuDefeated && !!f1.seiryuDefeated && !!f1.suzakuDefeated && !!f1.byakkoDefeated;

  // Schedule story dialog display
  timerManager.setTimeout(() => {
    if (player.currentArea === 7) {
      // Area 7: Only show story after all four beasts defeated
      if (allDoneLocal) setShowStory('bossVictory');
    } else {
      // Other areas: Always show story
      setShowStory('bossVictory');
    }

    // Special hint after defeating Demon King (Area 6)
    if (player.currentArea === 6) {
      timerManager.setTimeout(() => {
        addToast('…どこかで扉が開く音がした。伝説の試練が現れたかもしれない…（ステージ7へ）');
      }, 600);
    }
  }, 1000);

  // Completion toast for Four Sacred Beasts
  if (player.currentArea === 7 && allDoneLocal) {
    addToast('🏆 四聖獣討伐！報酬がすべて揃った！');
  }
}

// ─── handleBattleItemUse ────────────────────────────────────────────────────

export interface BattleItemUseDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  setQuizCombo: (updater: (c: number) => number) => void;
}

export function handleBattleItemUse(idx: number, deps: BattleItemUseDeps) {
  const { player, setPlayer, addToast, setQuizCombo } = deps;
  const it = player.items[idx];
  if (!it || (it.qty || 0) <= 0) { addToast("使える どうぐが ない"); return; }
  setPlayer(p => {
    const items = [...p.items];
    items[idx] = { ...items[idx], qty: (items[idx].qty || 0) - 1 };
    if (items[idx].qty! <= 0) items.splice(idx, 1);
    if (it.effect === "heal") {
      const v = it.amount;
      return { ...p, hp: clamp(p.hp + v, 0, p.maxHP), items };
    } else if (it.effect === "mp") {
      const v = it.amount;
      return { ...p, mp: clamp(p.mp + v, 0, p.maxMP), items };
    } else if (it.effect === "comboUp") {
      // コンボ+N（バトル中）
      setQuizCombo(c => c + it.amount);
      addToast(`🔥 コンボ +${it.amount}`);
      return { ...p, items };
    } else if (it.effect === "comboGuard") {
      const cur = p.flags?.comboGuard || 0;
      const flags = { ...(p.flags || {}), comboGuard: cur + it.amount };
      addToast(`🛡 コンボ保護 +${it.amount}`);
      return { ...p, flags, items };
    }
    return { ...p, items };
  });
addToast(`🧪 ${it.name} を つかった`);
}

// ─── handleBattleLog ────────────────────────────────────────────────────────

export interface BattleLogDeps {
  battle: BattleState | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: Scene) => void;
  pushLog: (msg: string) => void;
}

export function handleBattleLogClick(deps: BattleLogDeps) {
  const { battle, setBattle, setScene, pushLog } = deps;
  if (!battle) return;
  if (battle.mode === "victory") {
    // 勝利モードでも、先にキューを吐き切ってからリザルトへ
    if (battle.queue.length > 0) {
      const [head, ...rest] = battle.queue;
      pushLog(head);
      setBattle(b => b ? { ...b, queue: rest } : b);
      return;
    }
    setScene("result");
    return;
  }
  // 最初の一押しでコマンドに移行するステップを挟む
  if (battle.mode === "queue" && battle.queue.length === 0) {
    setBattle(b => b ? { ...b, mode: "select" } : b);
    return;
  }
  if (battle.queue.length > 0) {
    const [head, ...rest] = battle.queue;
    pushLog(head);
    setBattle(b => b ? { ...b, queue: rest } : b);
  }
}

export function handleAdvanceBattleLog(deps: BattleLogDeps) {
  const { battle } = deps;
  if (!battle) return;
  if (battle.queue.length > 0) handleBattleLogClick(deps);
}

// ─── handleEnemyStrike ──────────────────────────────────────────────────────

export interface EnemyStrikeDeps {
  timerManager: TimerManager;
  battle: BattleState | null;
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  setScene: (scene: Scene) => void;
}

export function handleEnemyStrike(nextCheck: boolean, deps: EnemyStrikeDeps) {
  const { timerManager, battle, player, setPlayer, setBattleAnim, pushLog, vibrate, setScene } = deps;
  if (!battle) return;
  const playerDefense = effDEF(player);
  const { damage: dmg, blocked } = calculateEnemyDamage(battle.enemy, playerDefense);

  // プレイヤー被ダメージのアニメーション（赤フラッシュ）
  setBattleAnim({ type: 'playerHit', value: dmg });
  timerManager.setTimeout(() => setBattleAnim(null), 450);

  // HP減少は一度だけ計算し、同じ値をログ/死亡判定に使う（非同期更新によるズレ防止）
  const newHP = Math.max(0, player.hp - dmg);
  setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
  pushLog(`👊 ${battle.enemy.name} の こうげき！`);
  if (blocked > 0) {
    pushLog(`   防御で ${blocked} 軽減！ ${dmg} ダメージ！`);
  } else {
    pushLog(`   ${dmg} ダメージ！`);
  }
  pushLog(`${player.name} HP: ${newHP}/${player.maxHP}`);
  vibrate(50);

  timerManager.setTimeout(() => {
    if (newHP <= 0) {
      pushLog(``);
      pushLog(`💀 ${player.name} は ちからつきた…`);
      timerManager.setTimeout(() => setScene("result"), 200);
    }
  }, 40);
}

// ─── handleSkillOrMagic ─────────────────────────────────────────────────────

export interface SkillOrMagicDeps {
  battle: BattleState | null;
  player: Player;
  settings: Settings;
  dojoMode: DojoMode | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  addToast: (msg: string) => void;
}

/**
 * Calculate difficulty boost based on skill rank
 */
function getDifficultyBoost(rank: number): number {
  if (rank === 3) return 8;
  if (rank === 2) return 4;
  return 0;
}

/**
 * Get quiz pack type from skill type
 */
function getQuizPack(skillType: 'skill' | 'fire' | 'heal'): "attack" | "fire" | "heal" {
  return skillType === 'skill' ? 'attack' : skillType;
}

/**
 * Calculate power with ultimate upgrades applied
 */
function calculateUltimatePower(
  skillKey: string,
  basePower: number,
  player: Player
): number {
  if (skillKey === 'ultimate-aurora') {
    const plus = player.flags?.ultimateSkillPlus || 0;
    return powerWithPlus(basePower, plus);
  }

  if (skillKey === 'ultimate-cosmos') {
    const plus = player.flags?.ultimateMagicPlus || 0;
    return powerWithPlus(basePower, plus);
  }

  return basePower;
}

/**
 * Get display name with ultimate upgrades
 */
function getUltimateDisplayName(
  skillKey: string,
  baseName: string,
  player: Player
): string {
  if (skillKey === 'ultimate-aurora') {
    const plus = player.flags?.ultimateSkillPlus || 0;
    return ultimatePlusName(baseName, plus);
  }

  if (skillKey === 'ultimate-cosmos') {
    const plus = player.flags?.ultimateMagicPlus || 0;
    return ultimatePlusName(baseName, plus);
  }

  return baseName;
}

/**
 * Get dojo mode for quiz generation
 */
function getDojoModeForQuiz(dojoMode: DojoMode | null): 'arithmetic' | 'random' | 'hard' | undefined {
  if (dojoMode === 'arithmetic') return 'arithmetic';
  if (dojoMode === 'random') return 'random';
  if (dojoMode === 'hard') return 'hard';
  return undefined;
}

export function handleActivateSkillOrMagic(
  s: { key: string; name: string; rank: number; mp?: number; type: 'skill'|'fire'|'heal'; power: number },
  deps: SkillOrMagicDeps
) {
  const { battle, player, settings, dojoMode, setBattle, addToast } = deps;

  if (!battle) return;

  // Check MP cost for magic spells
  const mpRequired = s.mp || 0;
  const isMagicSpell = s.type === 'fire' || s.type === 'heal';
  if (isMagicSpell && player.mp < mpRequired) {
    addToast("MPが たりない！");
    return;
  }

  // Calculate difficulty boost based on skill rank
  const diffBoost = getDifficultyBoost(s.rank);

  // Determine quiz pack type
  const pack = getQuizPack(s.type);

  // Apply ultimate upgrades
  const plusPower = calculateUltimatePower(s.key, s.power, player);
  const displayName = getUltimateDisplayName(s.key, s.name, player);

  // Generate quiz
  const { quiz, time } = makeQuizPack(
    settings.difficulty,
    pack,
    {
      diffBoost,
      hardQuizRandom: settings.hardQuizRandom,
      dojo: getDojoModeForQuiz(dojoMode)
    }
  );

  // Update battle state with quiz
  setBattle(b => b ? {
    ...b,
    mode: 'quiz',
    quiz: {
      quiz,
      timeMax: time,
      timeLeft: time,
      timeStart: Date.now(),
      pack,
      power: plusPower,
      meta: {
        moveName: displayName,
        isSkill: s.type === 'skill',
        mpCost: s.mp,
        diffBoost
      }
    }
  } : b);
}

// ─── handleStartBrainQuiz ───────────────────────────────────────────────────

export interface StartBrainQuizDeps {
  battle: BattleState | null;
  player: { mp: number };
  settings: Settings;
  dojoMode: DojoMode | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  addToast: (msg: string) => void;
  gameMode: GameMode;
  currentAreaId: number;
  quizTypesOverride: QuizType[] | null;
}

export function handleStartBrainQuiz(pack: "attack" | "fire" | "heal" | "run", deps: StartBrainQuizDeps) {
  const { battle, player, settings, dojoMode, setBattle, addToast, gameMode, currentAreaId, quizTypesOverride } = deps;

  if (!battle) return;
  if (pack === "fire" && player.mp < 4) { addToast("MPが たりない！"); return; }
  if (pack === "heal" && player.mp < 3) { addToast("MPが たりない！"); return; }

  // Decide effective quiz types with fallback order:
  // Dojo override -> Library boss mapping (when boss) -> settings.quizTypes
  let effectiveQuizTypes: QuizType[] | undefined = undefined;
  if (gameMode === 'library' && quizTypesOverride && quizTypesOverride.length > 0) {
    effectiveQuizTypes = quizTypesOverride;
  } else if (battle.enemy?.boss && gameMode === 'library') {
    const mapped = getLibraryBossQuizTypes(currentAreaId);
    if (mapped && mapped.length > 0) effectiveQuizTypes = mapped;
  } else {
    effectiveQuizTypes = settings.quizTypes;
  }
  const { quiz, time, power } = makeQuizPack(
    settings.difficulty,
    pack,
    {
      hardQuizRandom: settings.hardQuizRandom,
      // 道場モードをクイズ生成に伝える
      dojo: dojoMode === 'arithmetic' ? 'arithmetic' : dojoMode === 'random' ? 'random' : dojoMode === 'hard' ? 'hard' : undefined,
      // カスタム問題タイプを渡す（物語モードと無限の回廊モード用）
      quizTypes: effectiveQuizTypes
    }
  );
  setBattle(b => b ? { ...b, mode: "quiz", quiz: { quiz, timeMax: time, timeLeft: time, timeStart: Date.now(), pack, power } } : b);
}

// ─── handleStartEncounter ───────────────────────────────────────────────────

export interface StartEncounterDeps {
  player: { currentArea: number; endlessFloor?: number };
  gameMode: GameMode;
  settings: Settings;
  currentDex: DexData;
  pick: <T>(arr: T[]) => T;
  setBattle: (battle: BattleState) => void;
  setScene: (scene: Scene) => void;
  recordSeen: (name: string) => void;
}

export function handleStartEncounter(tile: Tile, deps: StartEncounterDeps) {
  const { player, gameMode, settings, currentDex, pick, setBattle, setScene, recordSeen } = deps;
  
  // Use encounter adapter for enemy preparation
  const encounterResult = prepareEncounter({
    currentArea: player.currentArea,
    gameMode,
    endlessFloor: player.endlessFloor,
    difficulty: settings.difficulty,
    tile,
    pickFn: pick
  });

  if (!encounterResult) {
    // それでも選べない場合は遭遇をスキップ（安全策）
    return;
  }
  
  const { enemy, isBossRush, isEndless } = encounterResult;
  
  // 登場セリフ (use extracted function)
  const intro: string[] = getEncounterIntroLines(enemy, {
    isKirin: enemy.name === '九尾の麒麟',
    isEndless,
    isBossRush,
    floor: player.endlessFloor || 1,
    kirinAttempt: (currentDex[enemy.name]?.seen || 0) + 1,
  });
  setBattle({ enemy, log: [intro[0]], queue: intro.slice(1), mode: "queue", quizStats: { total: 0, correct: 0, totalTime: 0 } });
  setScene("battle");
  recordSeen(enemy.name);
}

// ─── handleExpGoldReward ────────────────────────────────────────────────────

export interface ExpGoldRewardDeps {
  timerManager: TimerManager;
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setLevelUpDialog: (dialog: LevelUpDialogState) => void;
}

export function handleExpGoldReward(exp: number, gold: number, deps: ExpGoldRewardDeps): { levelUp?: LevelUpInfo, details?: LevelUpDetail[] } {
  const { timerManager, setPlayer, addToast, setBattleAnim, setLevelUpDialog } = deps;
  let resultInfo: { levelUp?: LevelUpInfo, details?: LevelUpDetail[] } = {};
  setPlayer(p => {
    const { player: updated, levelUp, details } = applyExpGold(p, exp, gold);
    if (levelUp) {
      addToast(`🎉 レベル ${levelUp.newLv} に あがった！`);
      // レベルアップ演出（早めに出す）
      setBattleAnim({ type: 'levelup' });
      timerManager.setTimeout(() => { setBattleAnim(null); }, 2200);
      // 詳細ダイアログの表示は少し遅らせる（戦闘ログの余韻を確保）
      const info = levelUp;
      const det = details;
      timerManager.setTimeout(() => {
        setLevelUpDialog({ visible: true, info: info, details: det });
      }, 1200);
    }
    resultInfo = { levelUp, details };
    return updated;
  });
  return resultInfo;
}

// ─── handleQuizResult ───────────────────────────────────────────────────────

export interface QuizResultDeps {
  timerManager: TimerManager;
  battle: BattleState | null;
  player: Player;
  gameMode: GameMode;
  quizCombo: number;
  settings: Settings;
  equipDex: EquipDexState;
  currentAreaInfo: { bossName: string };
  enemyPanelRef: React.RefObject<HTMLDivElement | null>;
  currentDex: DexData;
  dojoMode: DojoMode | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setScene: (scene: Scene) => void;
  setShowStory: (story: "bossVictory" | "bossEncounter" | null) => void;
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
  giveExpGold: (exp: number, gold: number) => { levelUp?: LevelUpInfo, details?: LevelUpDetail[] };
  recordDefeated: (name: string) => void;
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void;
}

export function handleQuizResult(ok: boolean, pack: "attack" | "fire" | "heal" | "run", _power: number, deps: QuizResultDeps) {
  const {
    battle,
    setBattle
  } = deps;

  if (!battle || !battle.quiz) return;

  // クイズ統計を更新（更新後のスナップショットを作成してハンドラに渡す）
  const timeSpent = battle.quiz.timeStart ? (Date.now() - battle.quiz.timeStart) / 1000 : 0;

  const updatedStats = {
    total: battle.quizStats.total + 1,
    correct: battle.quizStats.correct + (ok ? 1 : 0),
    totalTime: battle.quizStats.totalTime + timeSpent
  };

  const updatedTestMode = battle.testMode ? {
    ...battle.testMode,
    questionsAsked: battle.testMode.questionsAsked + 1,
    correctAnswers: battle.testMode.correctAnswers + (ok ? 1 : 0)
  } : undefined;

  const nextBattle: BattleState = {
    ...battle,
    quizStats: updatedStats,
    testMode: updatedTestMode
  };

  // 状態を更新
  setBattle(() => nextBattle);

  // Delegate to action-specific handlers with updated battle snapshot
  const actionDeps = { ...deps, battle: nextBattle };

  if (pack === "heal") {
    handleHealAction(ok, timeSpent, actionDeps);
    return;
  }

  if (pack === "run") {
    handleRunAction(ok, timeSpent, actionDeps);
    return;
  }

  // attack / fire
  if (ok) {
    handleSuccessfulAttack(pack, timeSpent, actionDeps);
  } else {
    handleFailedAttack(pack, timeSpent, actionDeps);
  }
}

// ─── actions/healActionHandler ──────────────────────────────────────────────

export interface HealActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  player: Player;
  quizCombo: number;
  settings: Settings;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
}

/**
 * Handle heal action result
 */
export function handleHealAction(ok: boolean, timeSpent: number, deps: HealActionDeps): void {
  const {
    battle,
    player,
    quizCombo,
    settings,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    addToast,
    pushLog,
    timerManager,
    vibrate,
    enemyStrike
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Calculate heal outcome
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processHealResult(ok, context, timeSpent);

  // Apply HP/MP changes
  if (outcome.playerHPChange !== undefined) {
    const newHP = clamp(player.hp + outcome.playerHPChange, 0, player.maxHP);
    setPlayer(p => ({
      ...p,
      hp: newHP,
      mp: p.mp + (outcome.playerMPChange || 0)
    }));
  }

  // Update combo state
  processComboChange(outcome.comboChange, player, setPlayer, setQuizCombo, addToast);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Show heal animation
  if (outcome.playerHPChange) {
    showHealAnimation(outcome.playerHPChange, { setBattleAnim, timerManager, vibrate });
    // 回復音を再生（成功時のみ）
    if (ok && outcome.playerHPChange > 0) {
      playSoundEffect('heal', settings.soundEffects);
    }
  }

  // Enemy counter-attack if heal failed
  if (!ok) {
    enemyStrike();
  }
}

// ─── actions/runActionHandler ───────────────────────────────────────────────

export interface RunActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  settings: Settings;
  setScene: (scene: Scene) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  pushLog: (msg: string) => void;
}

/**
 * Handle run/escape action result
 */
export function handleRunAction(ok: boolean, timeSpent: number, deps: RunActionDeps): void {
  const {
    battle,
    settings,
    setScene,
    setQuizCombo,
    pushLog,
    timerManager
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Calculate run outcome
  const hard = isHardQuiz(battle.quiz.quiz);
  const outcome = processRunResult(ok, timeSpent, settings, hard);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  if (ok) {
    // Successful escape: quick return to map
    timerManager.setTimeout(() => setScene("map"), 120);
  } else {
    // Failed escape: reset combo and delayed return
    setQuizCombo(0);

    // Call onVictory for scripted battles (e.g., forced tutorial escapes)
    if (battle.onVictory) {
      battle.onVictory();
    }

    timerManager.setTimeout(() => setScene("map"), 1200);
  }
}

// ─── actions/attackActionHandler ────────────────────────────────────────────

export interface AttackActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  player: Player;
  gameMode: GameMode;
  quizCombo: number;
  settings: Settings;
  equipDex: EquipDexState;
  currentAreaInfo: { bossName: string };
  enemyPanelRef: React.RefObject<HTMLDivElement | null>;
  currentDex: DexData;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setShowStory: (story: "bossVictory" | "bossEncounter" | null) => void;
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
  giveExpGold: (exp: number, gold: number) => { levelUp?: LevelUpInfo, details?: LevelUpDetail[] };
  recordDefeated: (name: string) => void;
  addToEquipDex: (kind: 'weapon'|'armor', name: string) => void;
}

/**
 * Handle successful attack/fire action
 */
export function handleSuccessfulAttack(
  pack: "attack" | "fire",
  timeSpent: number,
  deps: AttackActionDeps
): void {
  const {
    timerManager,
    battle,
    player,
    gameMode,
    quizCombo,
    settings,
    equipDex,
    currentAreaInfo,
    enemyPanelRef,
    setBattle,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    setShowStory,
    setEquipDex,
    addToast,
    pushLog,
    vibrate,
    enemyStrike,
    giveExpGold,
    recordDefeated,
    addToEquipDex
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Check test mode completion first
  if (battle.testMode) {
    const { questionsAsked, totalQuestions, correctAnswers, requiredCorrect } = battle.testMode;

    // Log test progress
    pushLog(`📝 テスト進行: ${questionsAsked}/${totalQuestions}問 (正解: ${correctAnswers})`);

    // Check if test is complete
    if (questionsAsked >= totalQuestions) {
      const passed = correctAnswers >= requiredCorrect;

      if (passed) {
        // Test passed - player wins
        pushLog(`🎉 合格！ ${correctAnswers}/${totalQuestions}問 正解！`);
        pushLog(`💀 ${battle.enemy.name} を 倒した！`);
        playSoundEffect('victory', settings.soundEffects);

        // Force enemy HP to 0 for victory processing
        setBattle(b => b ? ({
          ...b,
          enemy: { ...b.enemy, hp: 0 }
        }) : b);

        // Process victory rewards
        const rewardResult = processVictoryRewards(
          { player, gameMode, settings, equipDex, battle, hard: false },
          { setPlayer, addToEquipDex, pushLog, giveExpGold }
        );

        // Display level-up if applicable
        if (rewardResult.levelUp) {
          const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
          applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
        }

        pushLog(``);
        pushLog(`「▶ 続ける」ボタンを押してください`);

        setBattle(b => b ? ({
          ...b,
          mode: "victory",
          rewards: {
            exp: rewardResult.exp,
            gold: rewardResult.gold,
            timeBonus: rewardResult.timeBonus,
            items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
            levelUp: rewardResult.levelUp,
            levelUpDetails: rewardResult.levelUpDetails
          }
        }) : b);

        recordDefeated(battle.enemy.name);

        if (gameMode === 'library' && battle.onVictory) {
          battle.onVictory();
        }

        // Process boss victory for library mode
        if (gameMode === 'library' && battle.enemy.boss && battle.enemy.name === currentAreaInfo.bossName) {
          processBossVictory(
            { player, gameMode, battle, currentAreaInfo, equipDex },
            { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
          );
        }
      } else {
        // Test failed - player loses
        pushLog(`❌ 不合格... ${correctAnswers}/${totalQuestions}問 正解（${requiredCorrect}問以上必要）`);
        pushLog(`${battle.enemy.name} に敗北した...`);

        // Set player HP to 0 for defeat
        setPlayer(p => ({ ...p, hp: 0 }));

        timerManager.setTimeout(() => {
          pushLog(``);
          pushLog(`戦闘に敗れた...`);
          pushLog(`「▶ 続ける」ボタンを押してください`);
          setBattle(b => b ? ({ ...b, mode: "victory" }) : b);
        }, 1000);
      }

      return; // Exit early - test mode complete
    } else {
      // Test continues - just log progress and continue to next question
      timerManager.setTimeout(() => {
        setBattle(b => b ? ({ ...b, mode: "select" }) : b);
      }, 1500);
      return;
    }
  }

  // Calculate attack outcome (normal battle mode)
  const hard = isHardQuiz(battle.quiz.quiz);
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processAttackResult(true, pack, context, timeSpent);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Show bonus animations (speed, hard quiz)
  showBonusAnimations(!!outcome.speedBonus, !!outcome.hardBonus, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Apply MP cost for magic
  if (outcome.playerMPChange) {
    setPlayer(p => ({ ...p, mp: p.mp + outcome.playerMPChange! }));
  }

  // Increase combo
  if (typeof outcome.comboChange === 'number') {
    const comboIncrease = outcome.comboChange;
    setQuizCombo((c) => {
      const newCombo = c + comboIncrease;
      // コンボ音を再生（5の倍数で特別な音）
      if (newCombo > 0 && newCombo % 5 === 0) {
        playSoundEffect('combo', settings.soundEffects);
      }
      return newCombo;
    });
  }

  // Apply damage to enemy
  if (outcome.enemyDamage) {
    setBattle(b => b ? ({
      ...b,
      enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - outcome.enemyDamage!) }
    }) : b);
    // 攻撃音を再生
    playSoundEffect('attack', settings.soundEffects);
  }

  // Show damage animation with scroll effect
  const dmg = outcome.enemyDamage || 0;
  showDamageAnimation(dmg, !!outcome.comboBonus, enemyPanelRef, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Check for enemy defeat after animation
  timerManager.setTimeout(() => {
    const after = battle.enemy.hp - dmg;

    if (after <= 0) {
      // Enemy defeated
      pushLog(`💀 ${battle.enemy.name} を たおした！`);
      // 勝利音を再生
      playSoundEffect('victory', settings.soundEffects);

      // Process victory rewards and equipment drops
      const rewardResult = processVictoryRewards(
        { player, gameMode, settings, equipDex, battle, hard },
        { setPlayer, addToEquipDex, pushLog, giveExpGold }
      );

      // Display level-up if applicable
      if (rewardResult.levelUp) {
        const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
        applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
      }

      // Prompt user to continue
      pushLog(``);
      pushLog(`「▶ 続ける」ボタンを押してください`);

      // Update battle state to victory mode
      setBattle(b => b ? ({
        ...b,
        mode: "victory",
        rewards: {
          exp: rewardResult.exp,
          gold: rewardResult.gold,
          timeBonus: rewardResult.timeBonus,
          items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
          levelUp: rewardResult.levelUp,
          levelUpDetails: rewardResult.levelUpDetails
        }
      }) : b);

      // Record defeat in bestiary
      recordDefeated(battle.enemy.name);

      // Call onVictory for endless mode floor bosses
      if (gameMode === 'endless' && battle.enemy.boss && battle.onVictory) {
        battle.onVictory();
      }

      // Process boss-specific victory events (guardians, ultimate unlocks)
      processBossVictory(
        { battle, player, gameMode, equipDex, currentAreaInfo },
        { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
      );
    } else {
      // Enemy still alive
      pushLog(`${battle.enemy.name} HP: ${after}/${battle.enemy.maxHP}`);
      enemyStrike();
    }
  }, 40);
}

/**
 * Handle failed attack/fire action
 */
export function handleFailedAttack(
  pack: "attack" | "fire",
  timeSpent: number,
  deps: AttackActionDeps
): void {
  const {
    battle,
    player,
    gameMode,
    quizCombo,
    settings,
    equipDex,
    currentAreaInfo,
    setBattle,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    setEquipDex,
    setShowStory,
    addToast,
    pushLog,
    timerManager,
    vibrate,
    enemyStrike,
    giveExpGold,
    recordDefeated,
    addToEquipDex
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Check test mode completion first (same logic as successful attack)
  if (battle.testMode) {
    const { questionsAsked, totalQuestions, correctAnswers, requiredCorrect } = battle.testMode;

    // Log test progress
    pushLog(`📝 テスト進行: ${questionsAsked}/${totalQuestions}問 (正解: ${correctAnswers})`);

    // Check if test is complete
    if (questionsAsked >= totalQuestions) {
      const passed = correctAnswers >= requiredCorrect;

      if (passed) {
        // Test passed - player wins (same as successful attack)
        pushLog(`🎉 合格！ ${correctAnswers}/${totalQuestions}問 正解！`);
        pushLog(`💀 ${battle.enemy.name} を 倒した！`);
        playSoundEffect('victory', settings.soundEffects);

        setBattle(b => b ? ({
          ...b,
          enemy: { ...b.enemy, hp: 0 }
        }) : b);

        const rewardResult = processVictoryRewards(
          { player, gameMode, settings, equipDex, battle, hard: false },
          { setPlayer, addToEquipDex, pushLog, giveExpGold }
        );

        if (rewardResult.levelUp) {
          const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
          applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
        }

        pushLog(``);
        pushLog(`「▶ 続ける」ボタンを押してください`);

        setBattle(b => b ? ({
          ...b,
          mode: "victory",
          rewards: {
            exp: rewardResult.exp,
            gold: rewardResult.gold,
            timeBonus: rewardResult.timeBonus,
            items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
            levelUp: rewardResult.levelUp,
            levelUpDetails: rewardResult.levelUpDetails
          }
        }) : b);

        recordDefeated(battle.enemy.name);

        if (gameMode === 'library' && battle.onVictory) {
          battle.onVictory();
        }

        if (gameMode === 'library' && battle.enemy.boss && battle.enemy.name === currentAreaInfo.bossName) {
          processBossVictory(
            { player, gameMode, battle, currentAreaInfo, equipDex },
            { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
          );
        }
      } else {
        // Test failed - player loses
        pushLog(`❌ 不合格... ${correctAnswers}/${totalQuestions}問 正解（${requiredCorrect}問以上必要）`);
        pushLog(`${battle.enemy.name} に敗北した...`);

        setPlayer(p => ({ ...p, hp: 0 }));

        timerManager.setTimeout(() => {
          pushLog(``);
          pushLog(`戦闘に敗れた...`);
          pushLog(`「▶ 続ける」ボタンを押してください`);
          setBattle(b => b ? ({ ...b, mode: "victory" }) : b);
        }, 1000);
      }

      return; // Exit early - test mode complete
    } else {
      // Test continues - just log progress and continue to next question
      timerManager.setTimeout(() => {
        setBattle(b => b ? ({ ...b, mode: "select" }) : b);
      }, 1500);
      return;
    }
  }

  // Calculate failed attack outcome (normal battle mode)
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processAttackResult(false, pack, context, timeSpent);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Apply MP cost for magic (still costs MP even if failed)
  if (outcome.playerMPChange) {
    setPlayer(p => ({ ...p, mp: p.mp + outcome.playerMPChange! }));
  }

  // Apply weak damage (skills only, magic does zero damage on fail)
  if (outcome.enemyDamage && outcome.enemyDamage > 0) {
    setBattle(b => b ? ({
      ...b,
      enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - outcome.enemyDamage!) }
    }) : b);
  }

  // Show weak damage animation
  showWeakDamageAnimation(outcome.enemyDamage || 0, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Apply combo guard or reset combo
  applyComboGuardOrReset(player, setPlayer, setQuizCombo, addToast);

  // Enemy counter-attack
  enemyStrike();
}

// ─── actionHandlers (re-exports for backward compatibility) ─────────────────

/**
 * Unified ActionHandlerDeps interface
 * Combines all action dependencies for convenience
 * @deprecated Use specific action deps (HealActionDeps, RunActionDeps, AttackActionDeps) instead
 */
export type ActionHandlerDeps = HealActionDeps & RunActionDeps & AttackActionDeps;
