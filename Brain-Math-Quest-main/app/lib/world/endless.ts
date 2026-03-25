import { pick, setSeed } from '../rng';
import { ENEMY_POOL, BOSS_POOL, type Enemy } from '../enemies';
import { BG_LABELS } from '../ui/labels';

export type EndlessKind = 'mob' | 'boss';

export type ScaledStats = {
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  spd: number;
};

export type EndlessUnit = {
  base: Enemy;
  kind: EndlessKind;
  stats: ScaledStats;
};

export type EndlessFloorData = {
  floor: number;
  seed: number;
  background: string; // path under /images/backgrounds
  mobs: EndlessUnit[];
  boss: EndlessUnit;
  flavor: string; // short randomized story-like text
};

// Background candidates based on docs/public/images/backgrounds/README.md
const BACKGROUND_POOL = [
  'plains.png',
  'forest.png',
  'cave.png',
  'volcano.png',
  'ice.png',
  'castle.png',
  'tower.png',
  'void.png',
  'bossroom.png',
] as const;

export function pickBackground(seed?: number): string {
  if (typeof seed === 'number') setSeed(seed);
  const name = pick(BACKGROUND_POOL as unknown as string[]);
  return `/images/backgrounds/${name}`;
}

/**
 * Deterministically pick a background per endless floor without mutating global RNG state.
 * This avoids calling setSeed/pick so that other random systems are not affected.
 */
export function pickBackgroundForFloor(floor: number): string {
  const names = BACKGROUND_POOL as unknown as string[];
  // Simple xorshift32 seeded by floor
  let x = (Math.max(1, floor | 0) ^ 0xBEEF) >>> 0;
  if (x === 0) x = 1;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const len = Math.max(1, names.length | 0);
  const idx = x % len;
  const name = names[idx] || 'plains.png';
  return `/images/backgrounds/${name}`;
}

export type EndlessRunTheme = {
  background: string; // URL path under /images/backgrounds
  story: string;      // Multiline intro for story overlay
};

// Very short randomized flavor lines for Endless mode
const FLAVOR_LOCATIONS = ['深き洞穴', '凍てつく谷', '紅蓮の火山', '忘れられた塔', '空虚の間', '古城の回廊'];
const FLAVOR_EVENTS = ['微かな囁きが聞こえる', '古い魔力の残滓を感じる', '遠くで金属音が響く', '不気味な気配が背筋をなでる', '封印の気配が濃くなる'];

/** Pick a single theme (background + intro story) for an Endless run. */
export function pickEndlessRunTheme(seed?: number): EndlessRunTheme {
  if (typeof seed === 'number') setSeed(seed ^ 0x1eed);
  const name = pick(BACKGROUND_POOL as unknown as string[]);
  const bg = `/images/backgrounds/${name}`;
  const loc = BG_LABELS[name] || '謎めく回廊';
  const ev = pick(FLAVOR_EVENTS as unknown as string[]);
  const lines = [
    '🌀 無限の回廊へようこそ…',
    '',
    `${loc}が続く、終わりなき試練の迷宮。`,
    `${ev}。`,
    '',
    '進むほどに強敵が現れる。',
    'どこまで深く潜れるか、試してみよ！',
  ];
  return { background: bg, story: lines.join('\n') };
}

export function pickMob(seed?: number): Enemy {
  if (typeof seed === 'number') setSeed(seed);
  const pool: Enemy[] = ENEMY_POOL.filter((e: Enemy) => !e.boss);
  return pick(pool);
}

export function pickBoss(seed?: number): Enemy {
  if (typeof seed === 'number') setSeed(seed);
  // include 麒麟（九尾の麒麟）を含む既存のボスプールから選択
  return pick(BOSS_POOL);
}

/**
 * Get the floor boss for a specific endless floor
 * Deterministically picks a boss based on floor number
 */
export function getFloorBoss(floor: number): Enemy {
  const idx = (floor - 1) % BOSS_POOL.length;
  return BOSS_POOL[idx];
}

// Simple monotonic scaling ignoring base stats
export function scaleStats(floor: number, kind: EndlessKind): ScaledStats {
  const n = Math.max(1, floor | 0);
  // スケーリングをやや緩やかに（成長指数を全体的に低減）
  const mob = {
    hpA: 12, hpB: 1.10,
    atkA: 4, atkB: 1.06,
    defA: 3, defB: 1.04,
    spdA: 4, spdB: 1.015,
  } as const;
  const bossMul = 1.8; // ボス倍率を少し上げる

  const A = kind === 'mob' ? 1 : bossMul;
  const hp = Math.round(A * mob.hpA * Math.pow(n, mob.hpB));
  const atk = Math.round(A * mob.atkA * Math.pow(n, mob.atkB));
  const def = Math.round(A * mob.defA * Math.pow(n, mob.defB));
  const spd = Math.round(A * mob.spdA * Math.pow(n, mob.spdB));
  return { hp, maxHP: hp, atk, def, spd };
}

export function generateEndlessFloor(floor: number, seed: number, opts?: { mobsPerFloor?: number }): EndlessFloorData {
  const mobsPerFloor = Math.max(1, Math.min(6, opts?.mobsPerFloor ?? 3));
  // 背景
  const background = pickBackground(seed ^ 0xBEEF);
  // 雑魚
  const mobs: EndlessUnit[] = [];
  for (let i = 0; i < mobsPerFloor; i++) {
    const e = pickMob(seed + i * 17);
    mobs.push({ base: e, kind: 'mob', stats: scaleStats(floor, 'mob') });
  }
  // ボス（麒麟含む）
  const bossBase = pickBoss(seed ^ 0xC0FFEE);
  const boss: EndlessUnit = { base: bossBase, kind: 'boss', stats: scaleStats(floor, 'boss') };
  const flavor = generateFlavor(floor, seed);
  return { floor, seed, background, mobs, boss, flavor };
}
export function generateFlavor(floor: number, seed?: number): string {
  if (typeof seed === 'number') setSeed(seed ^ (floor * 97));
  const loc = pick(FLAVOR_LOCATIONS as unknown as string[]);
  const ev = pick(FLAVOR_EVENTS as unknown as string[]);
  return `第${floor}階層：${loc}…${ev}`;
}

/**
 * Generate story text for a specific floor in endless mode
 */
export function generateFloorStory(floor: number): string {
  // Use floor as seed for deterministic but varied story
  const bgPath = pickBackgroundForFloor(floor);
  const bgName = bgPath.split('/').pop()?.replace('.png', '') || '';
  const locationName = BG_LABELS[bgName + '.png'] || '謎めく回廊';

  setSeed(floor * 13 + 7);
  const event = pick(FLAVOR_EVENTS as unknown as string[]);

  const lines = [
    `🌀 無限の回廊 - 第${floor}階層`,
    '',
    `${locationName}が続く、終わりなき試練の迷宮。`,
    `${event}。`,
    '',
    '進むほどに強敵が現れる。',
    'さらなる深層を目指せ！',
  ];

  return lines.join('\n');
}

/**
 * Virtual endless mode configuration (not dependent on AREAS array)
 * This provides standalone definitions for the endless corridor mode
 */
export const ENDLESS_CONFIG = {
  name: "無限の回廊",
  description: "九尾の麒麟を倒した先に現れた、果てしなく続く謎の回廊。",
  startPos: { r: 2, c: 2 },
  bossName: "フロアボス", // Placeholder - actual boss selected per floor
  bossPos: { r: 6, c: 10 },
  dojoPos: { r: 4, c: 2 },
  story: {
    intro: "🌀 無限の回廊へようこそ…\n\n九尾の麒麟を倒した者のみが辿り着ける、\n終わりなき試練の迷宮。\n\n進むほどに強力な敵が現れる。\nどこまで深く潜れるか、試してみよ！",
    bossEncounter: "👑 強力なフロアボスが立ちはだかる！",
    victory: "🎉 フロアボスを撃破！次の階層へ進む準備が整った！"
  }
} as const;
