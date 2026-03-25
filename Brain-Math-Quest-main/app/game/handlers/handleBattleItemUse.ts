/**
 * Battle Item Use Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles item use during battle.
 * Original location: DQBrain.tsx lines ~1715-1742
 */

import { Player } from '../../lib/gameTypes';
import { clamp } from '../../lib/uiLayout';

export interface BattleItemUseDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  setQuizCombo: (updater: (c: number) => number) => void;
}

export function handleBattleItemUse(idx: number, deps: BattleItemUseDeps) {
  const { player, setPlayer, addToast, setQuizCombo } = deps;
  const it = player.items[idx];
  if (!it || (it.qty || 0) <= 0) { addToast("使える どうぐが ない"); return; }
  setPlayer(p => {
    const items = [...p.items];
    items[idx] = { ...items[idx], qty: (items[idx].qty || 0) - 1 };
    if (items[idx].qty! <= 0) items.splice(idx, 1);
    if (it.effect === "heal") {
      const v = it.amount;
      return { ...p, hp: clamp(p.hp + v, 0, p.maxHP), items };
    } else if (it.effect === "mp") {
      const v = it.amount;
      return { ...p, mp: clamp(p.mp + v, 0, p.maxMP), items };
    } else if (it.effect === "comboUp") {
      // コンボ+N（バトル中）
      setQuizCombo(c => c + it.amount);
      addToast(`🔥 コンボ +${it.amount}`);
      return { ...p, items };
    } else if (it.effect === "comboGuard") {
      const cur = p.flags?.comboGuard || 0;
      const flags = { ...(p.flags || {}), comboGuard: cur + it.amount };
      addToast(`🛡 コンボ保護 +${it.amount}`);
      return { ...p, flags, items };
    }
    return { ...p, items };
  });
addToast(`🧪 ${it.name} を つかった`);
}
