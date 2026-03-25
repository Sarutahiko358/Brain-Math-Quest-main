/**
 * Boss Victory Processor
 *
 * Handles boss victory processing including Four Sacred Beasts rewards and story events.
 * Extracted from handleQuizResult.ts to reduce complexity.
 */

import { Player, GameMode, BattleState } from '../../lib/gameTypes';
import { ULTIMATE_WEAPON, ULTIMATE_ARMOR, ACC_BY_NAME } from '../../lib/equipment';
import { ULTIMATE_SKILL, ULTIMATE_MAGIC } from '../../lib/skills';
import { EquipDexState } from '../types';
import { TimerManager } from '../../lib/timerManager';

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
 * Process Four Sacred Beasts rewards
 */
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

type RewardType = 'weapon' | 'armor' | 'skill' | 'magic';

/**
 * Calculates which ultimate rewards are not yet obtained
 */
function calculateRemainingRewards(
  player: Player,
  equipDex: EquipDexState
): RewardType[] {
  const remaining: RewardType[] = [];

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
function hasReward(
  kind: RewardType,
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
function giveUltimateReward(
  player: Player,
  kind: RewardType,
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
  const allRewards: RewardType[] = ['weapon', 'armor', 'skill', 'magic'];

  for (const kind of allRewards) {
    if (!hasReward(kind, next, equipDex)) {
      next = giveUltimateReward(next, kind, guardianName, false, postRewardMsgs, setEquipDex);
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
function getRewardTypeName(kind: RewardType): string {
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
    next = giveUltimateReward(next, rewardType, guardianName, true, postRewardMsgs, setEquipDex);
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
