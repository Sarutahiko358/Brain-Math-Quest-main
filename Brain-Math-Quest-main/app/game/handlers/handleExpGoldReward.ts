/**
 * Experience and Gold Reward Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles exp/gold rewards and level-up.
 * Original location: DQBrain.tsx lines ~1046-1066
 */

import { Player } from '../../lib/gameTypes';
import { LevelUpInfo, LevelUpDetail, applyExpGold } from '../../lib/battle/flow';
import { BattleAnimState, LevelUpDialogState } from '../types';
import { TimerManager } from '../../lib/timerManager';

export interface ExpGoldRewardDeps {
  timerManager: TimerManager;
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  addToast: (msg: string) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setLevelUpDialog: (dialog: LevelUpDialogState) => void;
}

export function handleExpGoldReward(exp: number, gold: number, deps: ExpGoldRewardDeps): { levelUp?: LevelUpInfo, details?: LevelUpDetail[] } {
  const { timerManager, setPlayer, addToast, setBattleAnim, setLevelUpDialog } = deps;
  let resultInfo: { levelUp?: LevelUpInfo, details?: LevelUpDetail[] } = {};
  setPlayer(p => {
    const { player: updated, levelUp, details } = applyExpGold(p, exp, gold);
    if (levelUp) {
      addToast(`🎉 レベル ${levelUp.newLv} に あがった！`);
      // レベルアップ演出（早めに出す）
      setBattleAnim({ type: 'levelup' });
      timerManager.setTimeout(() => { setBattleAnim(null); }, 2200);
      // 詳細ダイアログの表示は少し遅らせる（戦闘ログの余韻を確保）
      const info = levelUp;
      const det = details;
      timerManager.setTimeout(() => {
        setLevelUpDialog({ visible: true, info: info, details: det });
      }, 1200);
    }
    resultInfo = { levelUp, details };
    return updated;
  });
  return resultInfo;
}
