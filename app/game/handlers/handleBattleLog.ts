/**
 * Battle Log UI Handlers
 * 
 * Mechanically extracted from DQBrain.tsx - handles battle log click progression.
 * Original location: DQBrain.tsx lines ~1756-1783
 */

import { BattleState, Scene } from '../../lib/gameTypes';

export interface BattleLogDeps {
  battle: BattleState | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setScene: (scene: Scene) => void;
  pushLog: (msg: string) => void;
}

export function handleBattleLogClick(deps: BattleLogDeps) {
  const { battle, setBattle, setScene, pushLog } = deps;
  if (!battle) return;
  if (battle.mode === "victory") {
    // 勝利モードでも、先にキューを吐き切ってからリザルトへ
    if (battle.queue.length > 0) {
      const [head, ...rest] = battle.queue;
      pushLog(head);
      setBattle(b => b ? { ...b, queue: rest } : b);
      return;
    }
    setScene("result");
    return;
  }
  // 最初の一押しでコマンドに移行するステップを挟む
  if (battle.mode === "queue" && battle.queue.length === 0) {
    setBattle(b => b ? { ...b, mode: "select" } : b);
    return;
  }
  if (battle.queue.length > 0) {
    const [head, ...rest] = battle.queue;
    pushLog(head);
    setBattle(b => b ? { ...b, queue: rest } : b);
  }
}

export function handleAdvanceBattleLog(deps: BattleLogDeps) {
  const { battle } = deps;
  if (!battle) return;
  if (battle.queue.length > 0) handleBattleLogClick(deps);
}
