/**
 * Equip Accessory Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles accessory equipment.
 * Original location: DQBrain.tsx lines ~289-294
 */

import { Player } from '../../lib/gameTypes';
import { ACC_BY_NAME } from '../../lib/equipment';

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
