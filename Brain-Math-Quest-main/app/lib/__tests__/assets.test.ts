import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ENEMY_POOL, BOSS_POOL } from '../enemies';

// ENEMY_POOL / BOSS_POOL の imageUrl が実ファイルとして存在するかを検証。
// ソースコードパースではなく実データ import ベースなので将来の動的生成に強い。

describe('enemy image assets mapping', () => {
  it('each enemy has a valid imageUrl and file exists', () => {
    const all = [...ENEMY_POOL, ...BOSS_POOL];
    expect(all.length).toBeGreaterThan(0);

    const missing: string[] = [];
    const blank: string[] = [];
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const e of all) {
      if (!e.imageUrl || typeof e.imageUrl !== 'string') {
        blank.push(e.name);
        continue;
      }
      if (seen.has(e.imageUrl)) duplicates.push(e.imageUrl);
      seen.add(e.imageUrl);
      // ルートは public/ 配下
      const abs = path.join(process.cwd(), 'public', e.imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(abs)) missing.push(`${e.name}:${e.imageUrl}`);
    }

    if (blank.length) {
      throw new Error(`Enemies without imageUrl:\n${blank.map(n => ' - ' + n).join('\n')}`);
    }
    if (missing.length) {
      throw new Error(`Missing enemy images:\n${missing.map(x => ' - ' + x).join('\n')}`);
    }
    // 重複は致命的ではないが通知（必要なら throw に変更可能）
    if (duplicates.length) {
      console.warn('Duplicate enemy imageUrl detected:', duplicates);
    }
  });

  it('ENEMY_POOL images should be in /images/enemies/mob/ directory', () => {
    const invalidPaths: string[] = [];

    for (const enemy of ENEMY_POOL) {
      if (!enemy.imageUrl.startsWith('/images/enemies/mob/')) {
        invalidPaths.push(`${enemy.name}: ${enemy.imageUrl}`);
      }
    }

    if (invalidPaths.length) {
      throw new Error(
        `ENEMY_POOL images must be in /images/enemies/mob/:\n${invalidPaths.map(x => ' - ' + x).join('\n')}`
      );
    }
  });

  it('BOSS_POOL images should be in correct directories (boss/ or lib/)', () => {
    const invalidPaths: string[] = [];

    for (const boss of BOSS_POOL) {
      const isStoryBoss = boss.imageUrl.startsWith('/images/enemies/boss/');
      const isLibraryBoss = boss.imageUrl.startsWith('/images/enemies/lib/');

      if (!isStoryBoss && !isLibraryBoss) {
        invalidPaths.push(`${boss.name}: ${boss.imageUrl}`);
      }
    }

    if (invalidPaths.length) {
      throw new Error(
        `BOSS_POOL images must be in /images/enemies/boss/ or /images/enemies/lib/:\n${invalidPaths.map(x => ' - ' + x).join('\n')}`
      );
    }
  });

  it('no SVG placeholder files should be referenced', () => {
    const all = [...ENEMY_POOL, ...BOSS_POOL];
    const svgReferences: string[] = [];

    for (const enemy of all) {
      if (enemy.imageUrl.endsWith('.svg')) {
        svgReferences.push(`${enemy.name}: ${enemy.imageUrl}`);
      }
    }

    if (svgReferences.length) {
      throw new Error(
        `SVG files should not be referenced (use PNG instead):\n${svgReferences.map(x => ' - ' + x).join('\n')}`
      );
    }
  });
});
