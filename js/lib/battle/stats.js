/**
 * Battle Stats Helper
 */

export function effATK(p) { return p.baseATK + (p.equip?.weapon?.atk || 0); }
export function effDEF(p) { return p.baseDEF + (p.equip?.armor?.def || 0); }
