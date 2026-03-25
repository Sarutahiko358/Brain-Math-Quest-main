// ─── fieldHandlers.ts ─────────────────────────────────────
// Consolidation of: handleFieldActions, handleShopActions, handleEquipAccessory
// Phase 1: file merge only – no logic changes
// ──────────────────────────────────────────────────────────

import { Player, Weapon, Armor, Tool } from '../../lib/gameTypes';
import { clamp } from '../../lib/uiLayout';
import { learned } from '../../lib/skills';
import { healAtInnCost } from '../utils';
import { ACC_BY_NAME } from '../../lib/equipment';

// ─── handleFieldActions ───────────────────────────────────

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

// ─── handleShopActions ────────────────────────────────────

export interface ShopActionDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  showConfirm: (msg: string) => Promise<boolean>;
  addToEquipDex: (kind: 'weapon' | 'armor', name: string) => void;
}

export async function buyWeapon(w: Weapon, deps: ShopActionDeps) {
  const { player, setPlayer, addToast, showConfirm, addToEquipDex } = deps;

  const tradeIn = Math.floor(player.equip.weapon.price / 2);
  const net = w.price - tradeIn;
  if (net > 0 && player.gold < net) { addToast("お金が たりない！"); return; }

  // 同じ武器の場合は専用確認
  if (w.name === player.equip.weapon.name) {
    const okSame = await showConfirm(`同じ武器『${w.name}』を購入しますか？（性能は変わりません）`);
    if (!okSame) return;
  }
  // 現在装備より弱い場合は専用確認
  else if (w.atk < player.equip.weapon.atk) {
    const ok = await showConfirm(`今の武器(${player.equip.weapon.name} ATK${player.equip.weapon.atk})より弱い武器です。購入しますか？`);
    if (!ok) return;
  }
  // 通常購入時も確認
  else {
    const ok = await showConfirm(`『${w.name}』を購入しますか？（下取り +${tradeIn}G / 支払い ${net}G）`);
    if (!ok) return;
  }

  setPlayer(p => ({ ...p, gold: p.gold - net, equip: { ...p.equip, weapon: w } }));
  addToEquipDex('weapon', w.name);
  addToast(`🔪 ${w.name} を かった！（下取り +${tradeIn}G / 支払い ${Math.max(0, net)}G）`);
}

export async function buyArmor(a: Armor, deps: ShopActionDeps) {
  const { player, setPlayer, addToast, showConfirm, addToEquipDex } = deps;

  const tradeIn = Math.floor(player.equip.armor.price / 2);
  const net = a.price - tradeIn;
  if (net > 0 && player.gold < net) { addToast("お金が たりない！"); return; }

  // 同じ防具の場合は専用確認
  if (a.name === player.equip.armor.name) {
    const okSame = await showConfirm(`同じ防具『${a.name}』を購入しますか？（性能は変わりません）`);
    if (!okSame) return;
  }
  // 現在装備より弱い場合は専用確認
  else if (a.def < player.equip.armor.def) {
    const ok = await showConfirm(`今の防具(${player.equip.armor.name} DEF${player.equip.armor.def})より弱い防具です。購入しますか？`);
    if (!ok) return;
  }
  // 通常購入時も確認
  else {
    const ok = await showConfirm(`『${a.name}』を購入しますか？（下取り +${tradeIn}G / 支払い ${net}G）`);
    if (!ok) return;
  }

  setPlayer(p => ({ ...p, gold: p.gold - net, equip: { ...p.equip, armor: a } }));
  addToEquipDex('armor', a.name);
  addToast(`🛡 ${a.name} を かった！（下取り +${tradeIn}G / 支払い ${Math.max(0, net)}G）`);
}

export async function buyTool(t: Tool, deps: ShopActionDeps) {
  const { player, setPlayer, addToast, showConfirm } = deps;
  if (player.gold < t.price) { addToast("お金が たりない！"); return; }

  // 購入確認
  const ok = await showConfirm(`『${t.name}』を購入しますか？（${t.price}G）`);
  if (!ok) return;

  setPlayer(p => {
    const items = [...p.items];
    const i = items.findIndex(it => it.name === t.name);
    if (i >= 0) items[i] = { ...items[i], qty: (items[i].qty || 0) + 1 };
    else items.push({ ...t, qty: 1 });
    return { ...p, gold: p.gold - t.price, items };
  });
  addToast(`🧪 ${t.name} を かった！`);
}

export function restAtInn(deps: ShopActionDeps) {
  const { player, setPlayer, addToast } = deps;
  const price = healAtInnCost(player);
  if (player.hp >= player.maxHP && player.mp >= player.maxMP) {
    addToast("🛏️ HP/MPは 満タンです！");
    return;
  }
  if (player.gold < price) { addToast("お金が たりない！"); return; }
  setPlayer(p => ({ ...p, gold: p.gold - price, hp: p.maxHP, mp: p.maxMP }));
  addToast("🛏️ HP/MP が かいふくした！");
}

// ─── handleEquipAccessory ─────────────────────────────────

export interface EquipAccessoryDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
}

export function handleEquipAccessory(name: string, deps: EquipAccessoryDeps) {
  const { setPlayer, addToast } = deps;
  const acc = ACC_BY_NAME[name];
  if (!acc) return;
  setPlayer(p => ({ ...p, equip: { ...p.equip, accessory: acc } }));
  addToast(`💍 ${name} を装備した！（常時コンボ+${acc.comboPlus || 0}）`);
}
