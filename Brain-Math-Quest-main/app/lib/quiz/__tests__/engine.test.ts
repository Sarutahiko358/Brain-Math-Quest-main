import { describe, it, expect } from 'vitest';
import {
  evaluateSpeed,
  calculateHealAmount,
  calculateAttackDamage,
  calculateTimeBonus,
  calculateRewards,
  calculateFailDamage,
  calculateEnemyDamage,
  processHealResult,
  processRunResult,
  processAttackResult,
} from '../engine';
import { Player, Enemy } from '../../gameTypes';
import { setSeed } from '../../rng';
import { QuizBundle } from '../types';
import { WEAPONS, ARMORS } from '../../equipment';

// Helper to create a minimal player for testing
function createTestPlayer(overrides?: Partial<Player>): Player {
  return {
    name: "テスト勇者",
    avatar: "🦸‍♀️",
    lv: 5,
    exp: 100,
    gold: 200,
    maxHP: 60,
    hp: 60,
    maxMP: 20,
    mp: 20,
    baseATK: 10,
    baseDEF: 8,
    equip: { weapon: WEAPONS[0], armor: ARMORS[0], accessory: null },
    items: [],
    keyItems: [],
    pos: { r: 2, c: 2 },
    currentArea: 1,
    clearedAreas: [],
    storyShownAreas: [],
    ...overrides,
  };
}

// Helper to create a test enemy
function createTestEnemy(overrides?: Partial<Enemy>): Enemy {
  return {
    name: "テスト敵",
    emoji: "👹",
    maxHP: 50,
    hp: 50,
    atk: 12,
    imageUrl: "/test.png",
    minLevel: 1,
    maxLevel: 99,
    ...overrides,
  };
}

// Helper to create a test quiz bundle
function createTestQuiz(overrides?: Partial<QuizBundle>): QuizBundle {
  return {
    quiz: {
      type: 'SUM',
      prompt: 'テスト',
      expr: '1 + 1 = ?',
      ui: { kind: 'input' },
      answer: '2',
    },
    timeMax: 20,
    timeLeft: 20,
    timeStart: Date.now(),
    pack: 'attack',
    power: 1,
    ...overrides,
  };
}

describe('Quiz Engine - Speed Evaluation', () => {
  it('evaluates very fast answers correctly', () => {
    const result = evaluateSpeed(3, 'normal');
    expect(result.emoji).toBe('⚡');
    expect(result.text).toBe('速解き！');
    expect(result.speedBonus).toBe(true);
  });

  it('evaluates good speed answers correctly', () => {
    const result = evaluateSpeed(7, 'normal');
    expect(result.emoji).toBe('✓');
    expect(result.text).toBe('Good');
    expect(result.speedBonus).toBe(false);
  });

  it('evaluates slow answers correctly', () => {
    const result = evaluateSpeed(15, 'normal');
    expect(result.emoji).toBe('⏱');
    expect(result.text).toBe('OK');
    expect(result.speedBonus).toBe(false);
  });

  it('adjusts thresholds for easy difficulty', () => {
    const result = evaluateSpeed(7, 'easy');
    expect(result.speedBonus).toBe(true); // Under 7.5 seconds
  });

  it('adjusts thresholds for hard difficulty', () => {
    const result = evaluateSpeed(3, 'hard');
    expect(result.speedBonus).toBe(true); // Under 4 seconds
  });
});

describe('Quiz Engine - Heal Calculation', () => {
  it('calculates basic heal amount', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50 });
    const quiz = createTestQuiz({ pack: 'heal' });
    const amount = calculateHealAmount(player, 'normal', quiz, false);
    expect(amount).toBeGreaterThan(0);
    expect(amount).toBeLessThanOrEqual(player.maxHP);
  });

  it('applies hard quiz bonus to heal', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50 });
    const quiz = createTestQuiz({ pack: 'heal' });
    const normalAmount = calculateHealAmount(player, 'normal', quiz, false);
    const hardAmount = calculateHealAmount(player, 'normal', quiz, true);
    expect(hardAmount).toBeGreaterThan(normalAmount);
  });

  it('scales heal by difficulty', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50 });
    const quiz = createTestQuiz({ pack: 'heal' });
    const easyAmount = calculateHealAmount(player, 'easy', quiz, false);
    const hardAmount = calculateHealAmount(player, 'hard', quiz, false);
    expect(easyAmount).toBeGreaterThan(hardAmount); // Easy heals more
  });

  it('scales heal by rank (diffBoost)', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50 });
    const quiz1 = createTestQuiz({ pack: 'heal', meta: { diffBoost: 0 } });
    const quiz2 = createTestQuiz({ pack: 'heal', meta: { diffBoost: 8 } });
    const amount1 = calculateHealAmount(player, 'normal', quiz1, false);
    const amount2 = calculateHealAmount(player, 'normal', quiz2, false);
    expect(amount2).toBeGreaterThan(amount1); // Higher rank heals more
  });
});

describe('Quiz Engine - Attack Damage', () => {
  it('calculates basic attack damage', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const result = calculateAttackDamage(player, 'attack', 1, 0, false, false);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.base).toBeGreaterThan(0);
    expect(result.comboBoost).toBeGreaterThan(0);
    expect(result.details).toContain('ダメージ内訳');
  });

  it('applies combo bonus correctly', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const dmg0 = calculateAttackDamage(player, 'attack', 1, 0, false, false);
    const dmg3 = calculateAttackDamage(player, 'attack', 1, 3, false, false);
    expect(dmg3.damage).toBeGreaterThan(dmg0.damage);
    expect(dmg3.comboBoost).toBeGreaterThan(dmg0.comboBoost);
  });

  it('applies speed bonus multiplier', () => {
    const player = createTestPlayer({ baseATK: 10 });
    // Calculate average damage over multiple runs to account for randomness
    let totalNormal = 0;
    let totalFast = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      const dmgNormal = calculateAttackDamage(player, 'attack', 1, 0, false, false);
      const dmgFast = calculateAttackDamage(player, 'attack', 1, 0, true, false);
      totalNormal += dmgNormal.damage;
      totalFast += dmgFast.damage;
    }
    const avgNormal = totalNormal / runs;
    const avgFast = totalFast / runs;
    // Average speed bonus damage should be about 10% higher
    expect(avgFast).toBeGreaterThan(avgNormal);
    expect(avgFast / avgNormal).toBeGreaterThan(1.05); // At least 5% improvement on average
  });

  it('applies hard quiz bonus multiplier', () => {
    const player = createTestPlayer({ baseATK: 10 });
    // Calculate average damage over multiple runs to account for randomness
    let totalNormal = 0;
    let totalHard = 0;
    const runs = 100;
    for (let i = 0; i < runs; i++) {
      const dmgNormal = calculateAttackDamage(player, 'attack', 1, 0, false, false);
      const dmgHard = calculateAttackDamage(player, 'attack', 1, 0, false, true);
      totalNormal += dmgNormal.damage;
      totalHard += dmgHard.damage;
    }
    const avgNormal = totalNormal / runs;
    const avgHard = totalHard / runs;
    // Average hard bonus damage should be about 15% higher
    expect(avgHard).toBeGreaterThan(avgNormal);
    expect(avgHard / avgNormal).toBeGreaterThan(1.08); // At least 8% improvement on average (accounting for randomness)
  });

  it('fire attacks have higher base and combo', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const dmgAttack = calculateAttackDamage(player, 'attack', 1, 2, false, false);
    const dmgFire = calculateAttackDamage(player, 'fire', 1, 2, false, false);
    expect(dmgFire.damage).toBeGreaterThan(dmgAttack.damage);
  });

  it('respects power multiplier', () => {
    const player = createTestPlayer({ baseATK: 10 });
    // 同一の乱数列で公平に比較（挙動不変のままテスト安定化）
    setSeed(7890);
    const dmg1 = calculateAttackDamage(player, 'attack', 1, 0, false, false);
    setSeed(7890);
    const dmg2 = calculateAttackDamage(player, 'attack', 2, 0, false, false);
    // 丸めで境界一致もあるため >= を許容
    expect(dmg2.damage).toBeGreaterThanOrEqual(dmg1.damage * 1.5); // Should be roughly 2x
    setSeed(undefined);
  });

  it('includes passive combo bonus from accessory', () => {
    const player = createTestPlayer({
      baseATK: 10,
      equip: {
        weapon: WEAPONS[0],
        armor: ARMORS[0],
        accessory: { name: 'テストアクセ', comboPlus: 2 },
      },
    });
    // 固定シードで乱数を揃えて比較（フレーク対策）
    setSeed(123456);
    const dmg = calculateAttackDamage(player, 'attack', 1, 0, false, false);
    // With comboPlus: 2, effective combo = 0 + 2 = 2
    // comboBoost should be higher than without accessory
    // 同じシードで同じ乱数列を使用して、公平に比較
    setSeed(123456);
    const dmgNoAccessory = calculateAttackDamage(
      createTestPlayer({ baseATK: 10 }),
      'attack',
      1,
      0,
      false,
      false
    );
    expect(dmg.damage).toBeGreaterThan(dmgNoAccessory.damage);
    // シードモード解除（他テストへの影響を避ける）
    setSeed(undefined);
  });
});

describe('Quiz Engine - Time Bonus', () => {
  it('calculates time bonus for fast average', () => {
    const bonus = calculateTimeBonus(5, 'normal', false);
    expect(bonus).toBeGreaterThan(0);
  });

  it('returns zero for slow average', () => {
    const bonus = calculateTimeBonus(15, 'normal', false);
    expect(bonus).toBe(0);
  });

  it('gives higher bonus for boss enemies', () => {
    const normalBonus = calculateTimeBonus(5, 'normal', false);
    const bossBonus = calculateTimeBonus(5, 'normal', true);
    expect(bossBonus).toBeGreaterThan(normalBonus);
  });
});

describe('Quiz Engine - Rewards Calculation', () => {
  it('calculates basic rewards', () => {
    const enemy = createTestEnemy({ maxHP: 50, atk: 10 });
    const result = calculateRewards(enemy, 0, false);
    expect(result.exp).toBeGreaterThan(0);
    expect(result.gold).toBeGreaterThan(0);
  });

  it('applies boss multiplier', () => {
    const normalEnemy = createTestEnemy({ maxHP: 50, atk: 10, boss: false });
    const bossEnemy = createTestEnemy({ maxHP: 50, atk: 10, boss: true });
    const normalReward = calculateRewards(normalEnemy, 0, false);
    const bossReward = calculateRewards(bossEnemy, 0, false);
    expect(bossReward.exp).toBeGreaterThan(normalReward.exp);
    expect(bossReward.gold).toBeGreaterThan(normalReward.gold);
  });

  it('includes time bonus', () => {
    const enemy = createTestEnemy({ maxHP: 50, atk: 10 });
    const noBonus = calculateRewards(enemy, 0, false);
    const withBonus = calculateRewards(enemy, 10, false);
    expect(withBonus.exp).toBe(noBonus.exp + 10);
  });

  it('applies hard quiz bonus', () => {
    const enemy = createTestEnemy({ maxHP: 50, atk: 10, boss: false });
    const normal = calculateRewards(enemy, 0, false);
    const hard = calculateRewards(enemy, 0, true);
    expect(hard.exp).toBeGreaterThan(normal.exp);
    expect(hard.gold).toBeGreaterThan(normal.gold);
    expect(hard.breakdown.length).toBeGreaterThan(0);
  });
});

describe('Quiz Engine - Fail Damage', () => {
  it('calculates weak damage for normal attack', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const damage = calculateFailDamage(player, false);
    expect(damage).toBeGreaterThan(0);
    expect(damage).toBeLessThan(10); // Should be weak
  });

  it('returns zero damage for failed skill', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const damage = calculateFailDamage(player, true);
    expect(damage).toBe(0); // Skills do no damage on miss
  });
});

describe('Quiz Engine - Enemy Damage', () => {
  it('calculates enemy attack damage', () => {
    setSeed(0); // Set seed for deterministic RNG
    const enemy = createTestEnemy({ atk: 15 });
    const result = calculateEnemyDamage(enemy, 8);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.blocked).toBeGreaterThanOrEqual(0);
  });

  it('blocks more damage with higher defense', () => {
    setSeed(0); // Set seed for deterministic RNG
    const enemy = createTestEnemy({ atk: 15 });
    const lowDef = calculateEnemyDamage(enemy, 5);

    setSeed(0); // Reset seed to get same random value
    const highDef = calculateEnemyDamage(enemy, 15);

    expect(highDef.damage).toBeLessThan(lowDef.damage);
    expect(highDef.blocked).toBeGreaterThan(lowDef.blocked);
  });

  it('always deals at least 1 damage', () => {
    setSeed(0); // Set seed for deterministic RNG
    const enemy = createTestEnemy({ atk: 5 });
    const result = calculateEnemyDamage(enemy, 100);
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });
});

describe('Quiz Engine - Process Heal Result', () => {
  it('processes successful heal', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50, mp: 20 });
    const enemy = createTestEnemy();
    const quiz = createTestQuiz({ pack: 'heal', meta: { mpCost: 3 } });
    const context = { player, enemy, quiz, quizCombo: 2, settings: { difficulty: 'normal' as const } };
    
    const result = processHealResult(true, context, 5);
    
    expect(result.playerHPChange).toBeGreaterThan(0);
    expect(result.playerMPChange).toBe(-3);
    expect(result.comboChange).toBe(1);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.enemyDefeated).toBe(false);
  });

  it('processes failed heal with reset combo', () => {
    const player = createTestPlayer({ maxHP: 100, hp: 50, mp: 20 });
    const enemy = createTestEnemy();
    const quiz = createTestQuiz({ pack: 'heal' });
    const context = { player, enemy, quiz, quizCombo: 2, settings: { difficulty: 'normal' as const } };
    
    const result = processHealResult(false, context, 5);
    
    expect(result.comboChange).toBe('reset');
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages.some(m => m.includes('しっぱい'))).toBe(true);
  });
});

describe('Quiz Engine - Process Run Result', () => {
  it('processes successful escape', () => {
    const result = processRunResult(true, 3, { difficulty: 'normal' }, false);
    
    expect(result.escaped).toBe(true);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages.some(m => m.includes('離脱'))).toBe(true);
  });

  it('processes failed escape', () => {
    const result = processRunResult(false, 10, { difficulty: 'normal' }, false);
    
    expect(result.escaped).toBe(true);
    expect(result.comboChange).toBe('reset');
    expect(result.messages.some(m => m.includes('しっぱい'))).toBe(true);
  });

  it('includes hard bonus message on success', () => {
    const result = processRunResult(true, 3, { difficulty: 'hard' }, true);
    
    expect(result.hardBonus).toBe(true);
    expect(result.messages.some(m => m.includes('難問'))).toBe(true);
  });
});

describe('Quiz Engine - Process Attack Result', () => {
  it('processes successful attack', () => {
    const player = createTestPlayer({ baseATK: 10, hp: 60, mp: 20 });
    const enemy = createTestEnemy({ hp: 50 });
    const quiz = createTestQuiz({ pack: 'attack', power: 1 });
    const context = { player, enemy, quiz, quizCombo: 0, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(true, 'attack', context, 5);
    
    expect(result.enemyDamage).toBeGreaterThan(0);
    expect(result.comboChange).toBe(1);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.enemyDefeated).toBe(enemy.hp <= result.enemyDamage!);
  });

  it('detects enemy defeat', () => {
    const player = createTestPlayer({ baseATK: 100 }); // Very high attack
    const enemy = createTestEnemy({ hp: 10 }); // Low HP
    const quiz = createTestQuiz({ pack: 'attack', power: 10 });
    const context = { player, enemy, quiz, quizCombo: 0, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(true, 'attack', context, 3);
    
    expect(result.enemyDefeated).toBe(true);
  });

  it('processes failed attack with weak damage', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const enemy = createTestEnemy({ hp: 50 });
    const quiz = createTestQuiz({ pack: 'attack' });
    const context = { player, enemy, quiz, quizCombo: 2, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(false, 'attack', context, 10);
    
    expect(result.enemyDamage).toBeGreaterThanOrEqual(0);
    expect(result.comboChange).toBe('reset');
    expect(result.messages.some(m => m.includes('弱かった'))).toBe(true);
  });

  it('processes fire magic with MP cost', () => {
    const player = createTestPlayer({ baseATK: 10, mp: 20 });
    const enemy = createTestEnemy({ hp: 50 });
    const quiz = createTestQuiz({ pack: 'fire', power: 1.5, meta: { mpCost: 4 } });
    const context = { player, enemy, quiz, quizCombo: 0, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(true, 'fire', context, 5);
    
    expect(result.playerMPChange).toBe(-4);
    expect(result.enemyDamage).toBeGreaterThan(0);
    expect(result.messages.some(m => m.includes('MP -4'))).toBe(true);
  });

  it('includes speed bonus message', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const enemy = createTestEnemy({ hp: 50 });
    const quiz = createTestQuiz({ pack: 'attack' });
    const context = { player, enemy, quiz, quizCombo: 0, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(true, 'attack', context, 2); // Very fast
    
    expect(result.speedBonus).toBe(true);
    expect(result.messages.some(m => m.includes('速解き'))).toBe(true);
  });

  it('failed skill does zero damage', () => {
    const player = createTestPlayer({ baseATK: 10 });
    const enemy = createTestEnemy({ hp: 50 });
    const quiz = createTestQuiz({ 
      pack: 'attack', 
      meta: { isSkill: true, moveName: 'テスト必殺技' } 
    });
    const context = { player, enemy, quiz, quizCombo: 0, settings: { difficulty: 'normal' as const } };
    
    const result = processAttackResult(false, 'attack', context, 10);
    
    expect(result.enemyDamage).toBe(0);
    expect(result.messages.some(m => m.includes('はずれた'))).toBe(true);
  });
});
