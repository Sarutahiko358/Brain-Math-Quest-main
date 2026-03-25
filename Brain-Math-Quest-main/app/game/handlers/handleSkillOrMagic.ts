/**
 * Skill or Magic Activation Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles skill/magic activation in battle.
 * Original location: DQBrain.tsx lines ~1138-1165
 */

import { Player, BattleState } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { makeQuizPack } from '../../lib/quiz/generators';
import { powerWithPlus, ultimatePlusName } from '../../lib/skills';
import { DojoMode } from '../types';

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
