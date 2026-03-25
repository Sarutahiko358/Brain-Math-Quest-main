/**
 * Shop Action Handlers
 * 
 * Mechanically extracted from DQBrain.tsx - handles weapon/armor/tool purchases and inn rest.
 * Original location: DQBrain.tsx lines ~1730-1796
 */

import { Player, Weapon, Armor, Tool } from '../../lib/gameTypes';
import { healAtInnCost } from '../utils';

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
