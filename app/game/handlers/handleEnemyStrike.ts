/**
 * Enemy Strike Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles enemy attack during battle.
 * Original location: DQBrain.tsx lines ~1167-1195
 */

import { Player, BattleState, Scene } from '../../lib/gameTypes';
import { effDEF } from '../../lib/battle/stats';
import { calculateEnemyDamage } from '../../lib/quiz/engine';
import { BattleAnimState } from '../types';
import { TimerManager } from '../../lib/timerManager';

export interface EnemyStrikeDeps {
  timerManager: TimerManager;
  battle: BattleState | null;
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  setScene: (scene: Scene) => void;
}

export function handleEnemyStrike(nextCheck: boolean, deps: EnemyStrikeDeps) {
  const { timerManager, battle, player, setPlayer, setBattleAnim, pushLog, vibrate, setScene } = deps;
  if (!battle) return;
  const playerDefense = effDEF(player);
  const { damage: dmg, blocked } = calculateEnemyDamage(battle.enemy, playerDefense);

  // プレイヤー被ダメージのアニメーション（赤フラッシュ）
  setBattleAnim({ type: 'playerHit', value: dmg });
  timerManager.setTimeout(() => setBattleAnim(null), 450);

  // HP減少は一度だけ計算し、同じ値をログ/死亡判定に使う（非同期更新によるズレ防止）
  const newHP = Math.max(0, player.hp - dmg);
  setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
  pushLog(`👊 ${battle.enemy.name} の こうげき！`);
  if (blocked > 0) {
    pushLog(`   防御で ${blocked} 軽減！ ${dmg} ダメージ！`);
  } else {
    pushLog(`   ${dmg} ダメージ！`);
  }
  pushLog(`${player.name} HP: ${newHP}/${player.maxHP}`);
  vibrate(50);

  timerManager.setTimeout(() => {
    if (newHP <= 0) {
      pushLog(``);
      pushLog(`💀 ${player.name} は ちからつきた…`);
      timerManager.setTimeout(() => setScene("result"), 200);
    }
  }, 40);
}
