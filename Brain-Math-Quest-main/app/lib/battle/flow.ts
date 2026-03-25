import { nextExpFor } from './xp';
import { R } from '../rng';
import type { Player } from '../gameTypes';

export type LevelUpInfo = { oldLv: number; newLv: number; hpGain: number; mpGain: number; atkGain: number; defGain: number };
export type LevelUpDetail = { fromLv: number; toLv: number; hp: number; mp: number; atk: number; def: number };

export type ExpGoldResult = { player: Player; levelUp?: LevelUpInfo; details?: LevelUpDetail[] };

// Pure function: applies exp & gold gains and returns updated player plus level-up info.
export function applyExpGold(player: Player, exp: number, gold: number): ExpGoldResult {
  let lv = player.lv;
  let e = player.exp + exp;
  const g = player.gold + gold;
  const oldLv = player.lv;
  let levelsGained = 0;
  let incHP = 0, incMP = 0, incATK = 0, incDEF = 0;
  const details: LevelUpDetail[] = [];
  while (e >= nextExpFor(lv)) {
    e -= nextExpFor(lv);
    const from = lv;
    const dHP = R(4, 7);
    const dMP = R(2, 4);
    const dATK = 1;
    const dDEF = 1;
    lv++;
    levelsGained++;
    incHP += dHP; incMP += dMP; incATK += dATK; incDEF += dDEF;
    details.push({ fromLv: from, toLv: lv, hp: dHP, mp: dMP, atk: dATK, def: dDEF });
  }
  const newMaxHP = player.maxHP + incHP;
  const newMaxMP = player.maxMP + incMP;
  const updated: Player = {
    ...player,
    lv,
    exp: e,
    gold: g,
    maxHP: newMaxHP,
    // レベルアップ時はHP/MPを全回復。それ以外は従来どおりの増分回復。
    hp: levelsGained > 0 ? newMaxHP : Math.min(newMaxHP, player.hp + incHP),
    maxMP: newMaxMP,
    mp: levelsGained > 0 ? newMaxMP : Math.min(newMaxMP, player.mp + incMP),
    baseATK: player.baseATK + incATK,
    baseDEF: player.baseDEF + incDEF
  };
  if (levelsGained > 0) {
    return { player: updated, levelUp: { oldLv, newLv: lv, hpGain: incHP, mpGain: incMP, atkGain: incATK, defGain: incDEF }, details };
  }
  return { player: updated };
}
