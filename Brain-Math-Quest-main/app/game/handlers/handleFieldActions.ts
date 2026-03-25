/**
 * Field Action Handlers
 * 
 * Mechanically extracted from DQBrain.tsx - handles field item use and heal spells.
 * Original location: DQBrain.tsx lines ~1827-1873
 */

import { Player } from '../../lib/gameTypes';
import { clamp } from '../../lib/uiLayout';
import { learned } from '../../lib/skills';

export interface FieldActionDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  setQuizCombo: (updater: (c: number) => number) => void;
  showConfirm: (message: string) => Promise<boolean>;
}

// フィールド用のアイテム使用（メニューから）
export async function handleUseItemField(idx: number, deps: FieldActionDeps) {
  const { player, setPlayer, addToast, setQuizCombo, showConfirm } = deps;
  const it = player.items[idx];
  if (!it || (it.qty || 0) <= 0) { addToast('使える どうぐが ない'); return; }

  // 確認ダイアログを表示
  const effectDesc =
    it.effect === 'heal' ? `HP+${it.amount}` :
    it.effect === 'mp' ? `MP+${it.amount}` :
    it.effect === 'comboUp' ? `コンボ+${it.amount}` :
    it.effect === 'comboGuard' ? `コンボ維持（+${it.amount}）` : '';

  const confirmed = await showConfirm(`${it.name}（${effectDesc}）を使用しますか？`);
  if (!confirmed) return;

  setPlayer(p => {
    const items = [...p.items];
    items[idx] = { ...items[idx], qty: (items[idx].qty || 0) - 1 };
    if (items[idx].qty! <= 0) items.splice(idx, 1);
    if (it.effect === 'heal') {
      const v = it.amount;
      addToast(`✨ HP +${v}`);
      return { ...p, hp: clamp(p.hp + v, 0, p.maxHP), items };
    } else if (it.effect === 'mp') {
      const v = it.amount;
      addToast(`✨ MP +${v}`);
      return { ...p, mp: clamp(p.mp + v, 0, p.maxMP), items };
    } else if (it.effect === 'comboUp') {
      addToast(`🔥 コンボ +${it.amount}`);
      setQuizCombo(c => c + it.amount);
      return { ...p, items };
    } else if (it.effect === 'comboGuard') {
      const cur = p.flags?.comboGuard || 0;
      const next = Math.min(8, cur + it.amount);
      const flags = { ...(p.flags || {}), comboGuard: next };
      addToast(`🛡 コンボ保護 +${it.amount}（${next}/8）`);
      return { ...p, flags, items };
    }
    return { ...p, items };
  });
}

// フィールド用回復魔法の発動（一覧UI用）
export async function castFieldHeal(mpCost: number, ratio: number, label: string, requiredKey: string | undefined, fullHeal: boolean | undefined, deps: FieldActionDeps) {
  const { player, setPlayer, addToast, showConfirm } = deps;
  // 習得チェック（指定キーがある場合のみ）
  if (requiredKey) {
    const heals = learned(player.lv).heal;
    const learnedKeys = new Set(heals.map(h => h.key));
    if (!learnedKeys.has(requiredKey)) {
      addToast('この回復魔法は まだ習得していません');
      return;
    }
  }
  if (player.mp < mpCost) { addToast('MPが たりない！'); return; }

  // 確認ダイアログを表示
  const healAmount = fullHeal ? (player.maxHP - player.hp) : Math.max(6, Math.round(player.maxHP * ratio));
  const confirmed = await showConfirm(`${label}（MP${mpCost}消費、HP+${healAmount}）を使用しますか？`);
  if (!confirmed) return;

  setPlayer(p => ({ ...p, mp: p.mp - mpCost, hp: clamp(p.hp + healAmount, 0, p.maxHP) }));
  addToast(`✨ ${label}：HP +${healAmount}（MP -${mpCost}）`);
}
