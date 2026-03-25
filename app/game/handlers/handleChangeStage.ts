/**
 * Stage Change Handler
 *
 * Mechanically extracted from DQBrain.tsx - handles stage/area selection.
 * Original location: DQBrain.tsx lines ~951-975
 *
 * Note: Only handles story mode area changes (Area 1-9).
 * Endless mode floor changes are handled by handleChangeFloor.ts
 */

import { Player, GameMode } from '../../lib/gameTypes';
import { AREAS } from '../../lib/world/areas';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';

export interface ChangeStageDeps {
  player: Player;
  gameMode: GameMode;
  setPlayer: (updater: (p: Player) => Player) => void;
  setShowStageSelect: (show: boolean) => void;
  addToast: (msg: string) => void;
}

export function handleChangeStage(areaId: number, deps: ChangeStageDeps) {
  const { player, gameMode, setPlayer, setShowStageSelect, addToast } = deps;

  // Area 10 (無限の回廊) への移動は許可しない
  if (areaId === 10) {
    addToast(`⚠️ 無限の回廊へはステージ選択から移動できません`);
    return;
  }

  // Select appropriate area data based on game mode
  const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
  const targetArea = currentAreas.find(a => a.id === areaId);
  if (!targetArea) return;

  // エリア1は常に開放、それ以降は前のエリアをクリアしている必要がある
  const isUnlocked = (
    areaId === 1 ||
    player.clearedAreas.includes(areaId - 1) ||
    (!!targetArea.optionalUnlockAfterAreaId && player.clearedAreas.includes(targetArea.optionalUnlockAfterAreaId))
  );
  if (!isUnlocked) {
    addToast(`🔒 このステージはまだ開放されていません`);
    return;
  }

  setPlayer(p => ({
    ...p,
    currentArea: areaId,
    pos: targetArea.startPos,
  }));
  setShowStageSelect(false);
  addToast(`📍 ${targetArea.name} へ移動しました`);
}
