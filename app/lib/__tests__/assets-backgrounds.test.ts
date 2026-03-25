import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// 背景画像の必須セットが存在することを確認
const REQUIRED_BACKGROUNDS = [
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

describe('background image assets', () => {
  it('required background files exist under public/images/backgrounds', () => {
    const root = path.join(process.cwd(), 'public', 'images', 'backgrounds');
    const missing: string[] = [];
    for (const name of REQUIRED_BACKGROUNDS) {
      const abs = path.join(root, name);
      if (!fs.existsSync(abs)) missing.push(name);
    }
    expect(missing).toEqual([]);
  });
});
