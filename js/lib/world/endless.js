/**
 * Endless Mode Logic
 */

import { pick, setSeed } from '../rng.js';
import { ENEMY_POOL, BOSS_POOL } from '../enemies.js';
import { BG_LABELS } from '../ui/labels.js';

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
];

const FLAVOR_LOCATIONS = ['深き洞穴', '凍てつく谷', '紅蓮の火山', '忘れられた塔', '空虚の間', '古城の回廊'];
const FLAVOR_EVENTS = ['微かな囁きが聞こえる', '古い魔力の残滓を感じる', '遠くで金属音が響く', '不気味な気配が背筋をなでる', '封印の気配が濃くなる'];

export function pickBackground(seed) {
    if (typeof seed === 'number') setSeed(seed);
    const name = pick(BACKGROUND_POOL);
    return `/images/backgrounds/${name}`;
}

export function pickBackgroundForFloor(floor) {
    const names = BACKGROUND_POOL;
    let x = (Math.max(1, floor | 0) ^ 0xBEEF) >>> 0;
    if (x === 0) x = 1;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const len = Math.max(1, names.length | 0);
    const idx = x % len;
    const name = names[idx] || 'plains.png';
    return `/images/backgrounds/${name}`;
}

export function pickEndlessRunTheme(seed) {
    if (typeof seed === 'number') setSeed(seed ^ 0x1eed);
    const name = pick(BACKGROUND_POOL);
    const bg = `/images/backgrounds/${name}`;
    const loc = BG_LABELS[name] || '謎めく回廊';
    const ev = pick(FLAVOR_EVENTS);
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

export function pickMob(seed) {
    if (typeof seed === 'number') setSeed(seed);
    const pool = ENEMY_POOL.filter(e => !e.boss);
    return pick(pool);
}

export function pickBoss(seed) {
    if (typeof seed === 'number') setSeed(seed);
    return pick(BOSS_POOL);
}

export function getFloorBoss(floor) {
    const idx = (floor - 1) % BOSS_POOL.length;
    return BOSS_POOL[idx];
}

export function scaleStats(floor, kind) {
    const n = Math.max(1, floor | 0);
    const mob = {
        hpA: 12, hpB: 1.10,
        atkA: 4, atkB: 1.06,
        defA: 3, defB: 1.04,
        spdA: 4, spdB: 1.015,
    };
    const bossMul = 1.8;

    const A = kind === 'mob' ? 1 : bossMul;
    const hp = Math.round(A * mob.hpA * Math.pow(n, mob.hpB));
    const atk = Math.round(A * mob.atkA * Math.pow(n, mob.atkB));
    const def = Math.round(A * mob.defA * Math.pow(n, mob.defB));
    const spd = Math.round(A * mob.spdA * Math.pow(n, mob.spdB));
    return { hp, maxHP: hp, atk, def, spd };
}

export function generateFlavor(floor, seed) {
    if (typeof seed === 'number') setSeed(seed ^ (floor * 97));
    const loc = pick(FLAVOR_LOCATIONS);
    const ev = pick(FLAVOR_EVENTS);
    return `第${floor}階層：${loc}…${ev}`;
}

export function generateEndlessFloor(floor, seed, opts) {
    const mobsPerFloor = Math.max(1, Math.min(6, opts?.mobsPerFloor ?? 3));
    const background = pickBackground(seed ^ 0xBEEF);
    const mobs = [];
    for (let i = 0; i < mobsPerFloor; i++) {
        const e = pickMob(seed + i * 17);
        mobs.push({ base: e, kind: 'mob', stats: scaleStats(floor, 'mob') });
    }
    const bossBase = pickBoss(seed ^ 0xC0FFEE);
    const boss = { base: bossBase, kind: 'boss', stats: scaleStats(floor, 'boss') };
    const flavor = generateFlavor(floor, seed);
    return { floor, seed, background, mobs, boss, flavor };
}

export function generateFloorStory(floor) {
    const bgPath = pickBackgroundForFloor(floor);
    const bgName = bgPath.split('/').pop()?.replace('.png', '') || '';
    const locationName = BG_LABELS[bgName + '.png'] || '謎めく回廊';

    setSeed(floor * 13 + 7);
    const event = pick(FLAVOR_EVENTS);

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

export const ENDLESS_CONFIG = {
    name: "無限の回廊",
    description: "九尾の麒麟を倒した先に現れた、果てしなく続く謎の回廊。",
    startPos: { r: 2, c: 2 },
    bossName: "フロアボス",
    bossPos: { r: 6, c: 10 },
    dojoPos: { r: 4, c: 2 },
    story: {
        intro: "🌀 無限の回廊へようこそ…\n\n九尾の麒麟を倒した者のみが辿り着ける、\n終わりなき試練の迷宮。\n\n進むほどに強力な敵が現れる。\nどこまで深く潜れるか、試してみよ！",
        bossEncounter: "👑 強力なフロアボスが立ちはだかる！",
        victory: "🎉 フロアボスを撃破！次の階層へ進む準備が整った！"
    }
};
