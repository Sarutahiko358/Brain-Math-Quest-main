/**
 * Floor Change Handler for Endless Corridor
 *
 * Handles floor selection within the Endless Corridor mode
 */

import { Player } from '../../lib/gameTypes';

export interface ChangeFloorDeps {
  player: Player;
  setPlayer: (updater: (p: Player) => Player) => void;
  setShowStageSelect: (show: boolean) => void;
  addToast: (msg: string) => void;
}

export function handleChangeFloor(targetFloor: number, deps: ChangeFloorDeps) {
  const { player, setPlayer, setShowStageSelect, addToast } = deps;

  // 到達した階層まで選択可能
  const maxFloor = player.endlessFloor || 1;
  if (targetFloor < 1 || targetFloor > maxFloor) {
    addToast(`🔒 第${targetFloor}階層にはまだ到達していません`);
    return;
  }

  // 現在と同じ階層の場合
  if (targetFloor === player.endlessFloor) {
    setShowStageSelect(false);
    return;
  }

  setPlayer(p => ({
    ...p,
    endlessFloor: targetFloor
  }));
  setShowStageSelect(false);
  addToast(`📍 第${targetFloor}階層 へ移動しました`);
}
