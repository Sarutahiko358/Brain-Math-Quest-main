/**
 * Boss encounter utilities: functions for boss intro lines and special encounters
 * Extracted from DQBrain.tsx for S7 refactoring
 */

import { Enemy } from '../enemies';
import { pick } from '../rng';

/**
 * Get intro lines for Kirin (九尾の麒麟) boss based on attempt number
 * @param attempt - Number of times player has encountered this boss
 * @param variant - 'rush' for area 9 boss rush, 'boss' for normal boss encounter
 * @param enemy - Enemy data (for name and emoji)
 * @returns Array of intro lines [base message, additional dialogue]
 */
export function getKirinIntroLines(
  attempt: number,
  variant: 'rush' | 'boss',
  enemy: Enemy
): string[] {
  const base = `${enemy.emoji} ${enemy.name} が あらわれた！`;
  const a = Math.min(Math.max(1, Math.floor(attempt || 1)), 999);
  
  if (a === 1) {
    return [base, '「万雷轟く――我が尾は九つ、試練を越えし者のみ、その背を許す！」'];
  }
  
  if (a === 2) {
    return [
      base,
      variant === 'rush'
        ? '「雷鳴はなお止まず。よかろう、二度目の審判を与えよう。」'
        : '「再び来たか。雷の道は、一歩ごとに険しさを増す。」'
    ];
  }
  
  if (a === 3) {
    return [
      base,
      variant === 'rush'
        ? '「三たび挑むか。汝の覚悟、九つの尾で見極めよう。」'
        : '「三たび雷庭へ。ならば更なる高みを望むと知れ。」'
    ];
  }
  
  if (a === 4) {
    return [
      base,
      variant === 'rush'
        ? '「四度目の雷槌──いざ、天を裂く覚悟はあるか。」'
        : '「四度、天光きらめく──汝の器、いまこそ示せ。」'
    ];
  }
  
  // For 5+ attempts, pick a random line from the pool
  const poolCommon = [
    '「何度でもよい。磨け、心技体──雷は弱き者を選ばぬ。」',
    '「幾度でも相まみえよう。我は試練の守り手なり。」',
    '「その執念、雷光の如し──よかろう、さらなる試練を。」',
    '「尾は九つ、試練に終わりなし。汝の歩みを見届けよう。」',
    '「雷は鍛える者にのみ微笑む──来るがよい。」'
  ];
  
  const line = pick(poolCommon);
  return [base, line || poolCommon[0]];
}

/**
 * Get intro lines for standard boss encounter
 * @param enemy - Enemy data
 * @param isEndless - Whether in endless mode
 * @param floor - Floor number (for endless mode)
 * @returns Array of intro lines
 */
export function getBossIntroLines(
  enemy: Enemy,
  isEndless: boolean,
  floor?: number
): string[] {
  if (isEndless && floor) {
    return [`💀 第${floor}階層 フロアボス\n${enemy.emoji} ${enemy.name} が あらわれた！`];
  }
  return [`${enemy.emoji} ${enemy.name} が あらわれた！`];
}

/**
 * Get intro lines for guardian trial encounter
 * @param enemy - Enemy data
 * @returns Array of intro lines
 */
export function getGuardianIntroLines(enemy: Enemy): string[] {
  return [`${enemy.emoji} ${enemy.name} が 試練を与える！`];
}

/**
 * Get intro lines for encounter based on context
 * @param enemy - Enemy data
 * @param context - Encounter context
 * @returns Array of intro lines
 */
export function getEncounterIntroLines(
  enemy: Enemy,
  context: {
    isKirin: boolean;
    isEndless: boolean;
    isBossRush: boolean;
    floor?: number;
    kirinAttempt?: number;
    seenCount?: number;
  }
): string[] {
  const { isKirin, isEndless, isBossRush, floor, kirinAttempt, seenCount: _seenCount } = context;
  
  if (isKirin && kirinAttempt !== undefined) {
    const attempt = kirinAttempt;
    const variant = isBossRush ? 'rush' : 'boss';
    return getKirinIntroLines(attempt, variant, enemy);
  }
  
  if (isEndless) {
    return [`💀 第${floor || 1}階層\n${enemy.emoji} ${enemy.name} が あらわれた！`];
  }
  
  return [`${enemy.emoji} ${enemy.name} が あらわれた！`];
}
