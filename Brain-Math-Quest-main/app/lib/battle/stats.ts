import type { Player } from '../gameTypes';

export function effATK(p: Player) { return p.baseATK + p.equip.weapon.atk; }
export function effDEF(p: Player) { return p.baseDEF + p.equip.armor.def; }
