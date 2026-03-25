import { Difficulty, Player } from '../gameTypes';
import { Enemy } from '../enemies';
import { QuizBundle } from './types';
import { isHardQuiz } from './difficulty';
import { effATK } from '../battle/stats';
import { R } from '../rng';
import { clamp } from '../uiLayout';

/**
 * Quiz Engine - Orchestrates quiz execution logic extracted from DQBrain
 * This module contains pure functions for computing quiz results and battle outcomes
 */

export type QuizResultContext = {
  player: Player;
  enemy: Enemy;
  quiz: QuizBundle;
  quizCombo: number;
  settings: { difficulty: Difficulty };
};

export type QuizResultOutcome = {
  // Player state changes
  playerHPChange?: number;
  playerMPChange?: number;
  comboChange?: number | 'reset';
  
  // Enemy state changes
  enemyDamage?: number;
  
  // Rewards (if enemy defeated)
  exp?: number;
  gold?: number;
  
  // Messages and bonuses
  messages: string[];
  speedBonus?: boolean;
  hardBonus?: boolean;
  comboBonus?: boolean;
  
  // Battle state
  enemyDefeated: boolean;
  playerDefeated?: boolean;
  escaped?: boolean;
};

/**
 * Calculate speed evaluation for a quiz result
 */
export function evaluateSpeed(timeSpent: number, difficulty: Difficulty): {
  emoji: string;
  text: string;
  speedBonus: boolean;
} {
  const speedThreshold = difficulty === "easy" ? 15 : difficulty === "hard" ? 8 : 10;
  const fastThreshold = speedThreshold * 0.5;
  
  const speedBonus = timeSpent < fastThreshold;
  const emoji = timeSpent < fastThreshold ? "⚡" : timeSpent < speedThreshold ? "✓" : "⏱";
  const text = timeSpent < fastThreshold ? "速解き！" : timeSpent < speedThreshold ? "Good" : "OK";
  
  return { emoji, text, speedBonus };
}

/**
 * Calculate heal amount for a successful heal quiz
 */
export function calculateHealAmount(
  player: Player,
  difficulty: Difficulty,
  quiz: QuizBundle,
  hard: boolean
): number {
  const rnk = quiz.meta?.diffBoost ? (quiz.meta.diffBoost >= 8 ? 3 : quiz.meta.diffBoost >= 4 ? 2 : 1) : 1;
  const baseRatio = difficulty === "hard" ? 0.22 : difficulty === "easy" ? 0.36 : 0.28;
  const healRatio = baseRatio * (rnk === 3 ? 1.35 : rnk === 2 ? 1.18 : 1.0);
  const baseHeal = Math.max(6, Math.round(player.maxHP * healRatio));
  const hardBonus = hard ? 1.15 : 1.0;
  const amount = Math.round(baseHeal * hardBonus);
  return amount;
}

/**
 * Calculate attack damage for a successful attack/fire quiz
 */
export function calculateAttackDamage(
  player: Player,
  pack: "attack" | "fire",
  power: number,
  quizCombo: number,
  speedBonus: boolean,
  hardBonus: boolean
): {
  damage: number;
  base: number;
  comboBoost: number;
  details: string;
} {
  const atk = effATK(player);
  const base = pack === "fire" 
    ? Math.round(atk * 0.6) + R(6, 10) 
    : Math.round(atk * 0.35) + R(3, 7);
  
  const passivePlus = player.equip.accessory?.comboPlus || 0;
  const effectiveCombo = quizCombo + passivePlus;
  const comboBoost = Math.floor((effectiveCombo + 1) * (pack === "fire" ? 2.2 : 1.6));
  
  const speedMult = speedBonus ? 1.1 : 1.0;
  const hardMult = hardBonus ? 1.15 : 1.0;
  const damage = Math.max(1, Math.round((base + comboBoost) * power * speedMult * hardMult));
  
  let details = `【ダメージ内訳】\n`;
  details += `ATK: ${atk}  `;
  details += `基本: ${base}  `;
  details += `コンボ: +${comboBoost}  `;
  details += `威力倍率: x${power}  `;
  if (speedMult > 1) details += `速解き: x1.1  `;
  if (hardMult > 1) details += `難問: x1.15  `;
  details += `\n→ 合計: ${damage}`;
  
  return { damage, base, comboBoost, details };
}

/**
 * Calculate time bonus based on average quiz time
 */
export function calculateTimeBonus(
  avgTime: number,
  difficulty: Difficulty,
  isBoss: boolean
): number {
  const speedThreshold = difficulty === "easy" ? 15 : difficulty === "hard" ? 8 : 10;
  if (avgTime >= speedThreshold) return 0;
  
  const speedRatio = Math.max(0, (speedThreshold - avgTime) / speedThreshold);
  return Math.round((isBoss ? 12 : 5) * speedRatio);
}

/**
 * Calculate rewards for defeating an enemy
 */
export function calculateRewards(
  enemy: Enemy,
  timeBonus: number,
  hardBonus: boolean
): {
  exp: number;
  gold: number;
  breakdown: string[];
} {
  const strength = (enemy.maxHP + enemy.atk * 5) * (enemy.boss ? 1.6 : 1.0);
  const baseExp = Math.max(6, Math.round(strength * 0.25));
  const baseGold = Math.max(5, Math.round(strength * 0.18));
  
  const hardBonusReward = hardBonus ? (enemy.boss ? 6 : 3) : 0;
  const totalExp = baseExp + timeBonus + (enemy.boss ? 6 : 0) + hardBonusReward;
  const totalGold = baseGold + (enemy.boss ? 5 : 0) + Math.round(hardBonusReward / 2);
  
  const breakdown: string[] = [];
  if (hardBonusReward > 0) {
    breakdown.push(`🧩 難問ボーナス +${hardBonusReward} EXP / +${Math.round(hardBonusReward/2)} G`);
  }
  
  return { exp: totalExp, gold: totalGold, breakdown };
}

/**
 * Calculate fail damage for incorrect attack
 */
export function calculateFailDamage(player: Player, isSkill: boolean): number {
  if (isSkill) return 0;
  const atk = effATK(player);
  return Math.max(1, Math.round(atk * 0.15) + R(1, 3));
}

/**
 * Calculate enemy attack damage
 */
export function calculateEnemyDamage(enemy: Enemy, playerDefense: number): {
  damage: number;
  blocked: number;
} {
  const raw = Math.max(1, Math.round(enemy.atk - playerDefense * 0.35) + R(-1, 2));
  const damage = Math.max(1, raw);
  const blocked = Math.max(0, Math.round(playerDefense * 0.35));
  return { damage, blocked };
}

/**
 * Process heal quiz result
 */
export function processHealResult(
  ok: boolean,
  context: QuizResultContext,
  timeSpent: number
): QuizResultOutcome {
  const { player, quiz, settings } = context;
  const hard = isHardQuiz(quiz.quiz);
  const speed = evaluateSpeed(timeSpent, settings.difficulty);
  const messages: string[] = [];
  
  if (ok) {
    const amount = calculateHealAmount(player, settings.difficulty, quiz, hard);
    const newHP = clamp(player.hp + amount, 0, player.maxHP);
    const mpCost = quiz.meta?.mpCost ?? 3;
    const moveName = quiz.meta?.moveName || '回復魔法';
    const passivePlusLog = player.equip.accessory?.comboPlus || 0;
    
    messages.push(`${speed.emoji} ${speed.text} (${timeSpent.toFixed(1)}秒)`);
    messages.push(`${player.name} は ${moveName} を となえた！（MP -${mpCost}）`);
    messages.push(`✨ HP +${amount} 回復！ HP: ${newHP}/${player.maxHP}`);
    if (hard) messages.push(`🧩 難問ボーナス！ 回復量+15%`);
    messages.push(`（コンボ×${context.quizCombo + 1}${passivePlusLog ? ` (+${passivePlusLog})` : ''}）`);
    
    return {
      playerHPChange: amount,
      playerMPChange: -mpCost,
      comboChange: 1,
      messages,
      speedBonus: speed.speedBonus,
      hardBonus: hard,
      enemyDefeated: false,
    };
  } else {
    messages.push(`${player.name} の まほうは しっぱいした！`);
    messages.push("敵の反撃！");
    
    return {
      comboChange: 'reset',
      messages,
      enemyDefeated: false,
    };
  }
}

/**
 * Process run quiz result
 */
export function processRunResult(
  ok: boolean,
  timeSpent: number,
  settings: { difficulty: Difficulty },
  hard: boolean
): QuizResultOutcome {
  const speed = evaluateSpeed(timeSpent, settings.difficulty);
  const messages: string[] = [];
  
  if (ok) {
    messages.push(`${speed.emoji} ${speed.text} (${timeSpent.toFixed(1)}秒)`);
    messages.push(`逃げのスキを つくった！`);
    messages.push("🏃 戦闘から 離脱した！");
    if (hard) messages.push("🧩 難問ボーナス！");
    
    return {
      messages,
      speedBonus: speed.speedBonus,
      hardBonus: hard,
      enemyDefeated: false,
      escaped: true,
    };
  } else {
    messages.push(`にげるは しっぱいした！`);
    
    return {
      comboChange: 'reset',
      messages,
      enemyDefeated: false,
      escaped: true, // Still escaped but failed
    };
  }
}

/**
 * Process attack/fire quiz result
 */
/**
 * Generates bonus messages for successful attack
 */
function generateBonusMessages(speedBonus: boolean, hard: boolean): string[] {
  const messages: string[] = [];
  if (speedBonus) {
    messages.push(`⚡ 速解きボーナス！ ダメージ+10%`);
  }
  if (hard) {
    messages.push(`🧩 難問ボーナス！ ダメージ+15%`);
  }
  return messages;
}

/**
 * Generates attack action message based on pack type and skill
 */
function generateAttackActionMessage(
  playerName: string,
  pack: "attack" | "fire",
  isSkill: boolean,
  moveName: string | undefined,
  mpCost: number
): string {
  if (pack === "fire") {
    return `${playerName} は ${moveName || '攻撃魔法'} を となえた！（MP -${mpCost}）`;
  }
  if (isSkill) {
    return `${playerName} の ${moveName}！`;
  }
  return `${playerName} の こうげき！`;
}

/**
 * Generates damage message for successful attack
 */
function generateDamageMessage(
  pack: "attack" | "fire",
  enemyName: string,
  damage: number,
  quizCombo: number,
  passivePlus: number
): string {
  const icon = pack === "fire" ? "🔥" : "🗡";
  const comboText = `コンボ×${quizCombo + 1}${passivePlus ? ` (+${passivePlus})` : ""}`;
  return `${icon} ${enemyName} に ${damage} ダメージ！（${comboText}）`;
}

/**
 * Processes successful attack result
 */
function processSuccessfulAttack(
  pack: "attack" | "fire",
  context: QuizResultContext,
  speed: ReturnType<typeof evaluateSpeed>,
  hard: boolean,
  timeSpent: number
): QuizResultOutcome {
  const { player, enemy, quiz, quizCombo } = context;
  const isSkill = quiz.meta?.isSkill;
  const moveName = quiz.meta?.moveName;
  const mpCost = quiz.meta?.mpCost ?? (pack === 'fire' ? 4 : 0);
  const power = quiz.power;

  const { damage, details } = calculateAttackDamage(
    player,
    pack,
    power,
    quizCombo,
    speed.speedBonus,
    hard
  );

  const passivePlus = player.equip.accessory?.comboPlus || 0;

  const messages = [
    `${speed.emoji} ${speed.text} (${timeSpent.toFixed(1)}秒)`,
    details,
    ...generateBonusMessages(speed.speedBonus, hard),
    generateAttackActionMessage(player.name, pack, !!isSkill, moveName, mpCost),
    generateDamageMessage(pack, enemy.name, damage, quizCombo, passivePlus)
  ];

  const enemyDefeated = enemy.hp - damage <= 0;

  return {
    enemyDamage: damage,
    playerMPChange: pack === "fire" ? -mpCost : 0,
    comboChange: 1,
    messages,
    speedBonus: speed.speedBonus,
    hardBonus: hard,
    comboBonus: quizCombo >= 2,
    enemyDefeated,
  };
}

/**
 * Generates failure message based on pack type and skill
 */
function generateFailureMessage(
  playerName: string,
  pack: "attack" | "fire",
  isSkill: boolean,
  moveName: string | undefined,
  mpCost: number
): string {
  if (pack === 'fire') {
    return `${playerName} の ${moveName || '攻撃魔法'} は うまく きまらなかった！（MP -${mpCost}）`;
  }
  if (isSkill) {
    return `${playerName} の ${moveName} は はずれた！`;
  }
  return `${playerName} の こうげきは 弱かった！`;
}

/**
 * Processes failed attack result
 */
function processFailedAttack(
  pack: "attack" | "fire",
  context: QuizResultContext
): QuizResultOutcome {
  const { player, enemy, quiz } = context;
  const isSkill = quiz.meta?.isSkill || false;
  const moveName = quiz.meta?.moveName;
  const mpCost = quiz.meta?.mpCost ?? (pack === 'fire' ? 4 : 0);
  const failDmg = calculateFailDamage(player, isSkill);

  const messages = [
    generateFailureMessage(player.name, pack, isSkill, moveName, mpCost)
  ];

  if (failDmg > 0) {
    messages.push(`${enemy.name} に ${failDmg} ダメージ！`);
  }

  messages.push("敵の反撃！");

  return {
    enemyDamage: failDmg,
    playerMPChange: pack === 'fire' ? -mpCost : 0,
    comboChange: 'reset',
    messages,
    enemyDefeated: false,
  };
}

/**
 * Processes attack or fire quiz result
 */
export function processAttackResult(
  ok: boolean,
  pack: "attack" | "fire",
  context: QuizResultContext,
  timeSpent: number
): QuizResultOutcome {
  const { quiz, settings } = context;
  const hard = isHardQuiz(quiz.quiz);
  const speed = evaluateSpeed(timeSpent, settings.difficulty);

  if (ok) {
    return processSuccessfulAttack(pack, context, speed, hard, timeSpent);
  } else {
    return processFailedAttack(pack, context);
  }
}
