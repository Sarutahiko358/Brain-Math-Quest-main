/**
 * Encounter Logic
 */

import { ENEMY_POOL, BOSS_POOL } from '../enemies.js';
import { T } from './areas.js';
import { scaleStats } from './endless.js';

export function shouldRollEncounter(currentArea) {
    return currentArea < 7;
}

export function pickEnemy(currentArea, pickFn) {
    const pool = ENEMY_POOL;
    const available = pool.filter(e => (e.area === currentArea) && e.boss !== true);

    let enemy;
    if (available.length > 0) {
        const picked = pickFn(available);
        if (picked) enemy = { ...picked };
    } else {
        const fallbackPool = pool.filter(e => e.boss !== true);
        const localFallback = fallbackPool.filter(e => e.area === currentArea || !('area' in e) || e.area == null);
        const pickedLocal = localFallback.length > 0 ? pickFn(localFallback) : undefined;
        const pickedAny = !pickedLocal ? (fallbackPool.length > 0 ? pickFn(fallbackPool) : undefined) : undefined;
        const picked = pickedLocal || pickedAny;
        if (picked) enemy = { ...picked };
    }

    return enemy || null;
}

export function scaleEnemy(enemy, difficulty, isCaveOrCastle) {
    const dmul = difficulty === "easy" ? 0.9 : difficulty === "hard" ? 1.25 : 1.0;
    enemy.maxHP = Math.round(enemy.maxHP * dmul);
    enemy.hp = enemy.maxHP;
    enemy.atk = Math.round(enemy.atk * dmul + (isCaveOrCastle ? 2 : 0));
}

export function getAvailableEnemies(currentArea, isBoss) {
    const pool = isBoss ? BOSS_POOL : ENEMY_POOL;
    return pool.filter(e => (e.area === currentArea) && (isBoss ? e.boss === true : e.boss !== true));
}

function selectBossRushEnemy(pickFn) {
    const bossPool = BOSS_POOL.filter(b => b.name !== '九尾の麒麟');
    const picked = pickFn(bossPool);
    return picked ? { ...picked } : undefined;
}

function selectEndlessEnemy(pickFn) {
    const allEnemies = [...ENEMY_POOL, ...BOSS_POOL.filter(b => b.name !== '九尾の麒麟')];
    const picked = pickFn(allEnemies);
    return picked ? { ...picked } : undefined;
}

function selectNormalEnemy(currentArea, pickFn) {
    const availableEnemies = getAvailableEnemies(currentArea, false);

    if (availableEnemies.length > 0) {
        const picked = pickFn(availableEnemies);
        return picked ? { ...picked } : undefined;
    }

    const fallbackPool = ENEMY_POOL.filter(e => e.boss !== true);
    const localFallback = fallbackPool.filter(e => e.area === currentArea || !('area' in e) || e.area == null);
    const pickedLocal = localFallback.length > 0 ? pickFn(localFallback) : undefined;
    const pickedAny = !pickedLocal ? (fallbackPool.length > 0 ? pickFn(fallbackPool) : undefined) : undefined;
    const picked = pickedLocal || pickedAny;
    return picked ? { ...picked } : undefined;
}

function applyEnemyScaling(enemy, isEndlessMode, endlessFloor, difficulty, isCave) {
    if (isEndlessMode) {
        const floor = endlessFloor || 1;
        const asFieldBoss = !!enemy.boss;
        const base = scaleStats(floor, 'mob');
        const mul = asFieldBoss ? 1.4 : 1.0;
        const jitter = 0.9 + Math.random() * 0.2;
        enemy.maxHP = Math.round(base.maxHP * mul * jitter);
        enemy.hp = enemy.maxHP;
        enemy.atk = Math.round(base.atk * mul * jitter);
    } else {
        scaleEnemy(enemy, difficulty, isCave);
    }
}

export function prepareEncounter(context) {
    const { currentArea, gameMode, endlessFloor, difficulty, tile, pickFn } = context;

    const isBossRushArea = currentArea === 9;
    const isEndlessMode = gameMode === 'endless';
    const isCave = tile === T.Cave || tile === T.Castle;

    let enemy;
    if (isBossRushArea) {
        enemy = selectBossRushEnemy(pickFn);
    } else if (isEndlessMode) {
        enemy = selectEndlessEnemy(pickFn);
    } else {
        enemy = selectNormalEnemy(currentArea, pickFn);
    }

    if (!enemy) {
        return null;
    }

    applyEnemyScaling(enemy, isEndlessMode, endlessFloor, difficulty, isCave);

    return {
        enemy,
        isBossRush: isBossRushArea,
        isEndless: isEndlessMode
    };
}
