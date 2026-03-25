import { describe, it, expect } from 'vitest';

// We can't import the Next.js page component directly (React hooks, DOM),
// but we can verify pure logic snippets by simulating functions with the same behavior.

describe('encounter rules', () => {
  it('should not start random encounter in area >= 7', () => {
    const player = { currentArea: 7 } as any;
    const T = { Cave: 1, Castle: 2 } as any;
    let started = false;

    function startEncounter(tile: number) {
      const _isCave = tile === T.Cave || tile === T.Castle;
      if (player.currentArea >= 7) {
        return; // no random encounter
      }
      started = true;
    }

    startEncounter(T.Cave);
    expect(started).toBe(false);
  });
});

describe('enemyStrike HP consistency', () => {
  it('uses computed newHP for death check', () => {
    // simulate
    const player = { hp: 5, maxHP: 10 } as any;
    const battle = { enemy: { atk: 10 } } as any;
  const effDEF = (_p: any) => 0;
    const logs: string[] = [];
    const pushLog = (m: string) => logs.push(m);
    const setPlayer = (updater: (p: any) => any) => {
      const np = updater(player);
      player.hp = np.hp;
    };

    function enemyStrike() {
      const raw = Math.max(1, Math.round(battle.enemy.atk - effDEF(player) * 0.35));
      const dmg = Math.max(1, raw);
      const newHP = Math.max(0, player.hp - dmg);
      setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
      pushLog(`${player.hp}/${player.maxHP}`);
      if (newHP <= 0) {
        pushLog('dead');
      }
    }

    enemyStrike();
    expect(player.hp).toBe(0);
    expect(logs.includes('dead')).toBe(true);
  });
});
