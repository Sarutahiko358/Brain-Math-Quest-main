import React from 'react';
import Overlay from '../../components/Overlay';
import { Player } from '../../lib/gameTypes';
import { AREAS, AreaInfo } from '../../lib/world/areas';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';
import { useGameState, useGameActions } from '../contexts/GameContext';

/**
 * Check if an area is unlocked for the player
 */
function isAreaUnlocked(area: AreaInfo, player: Player): boolean {
  // Area 1 is always unlocked
  if (area.id === 1) return true;

  // Unlocked if previous area is cleared
  if (player.clearedAreas.includes(area.id - 1)) return true;

  // Unlocked if optional unlock requirement is met
  if (area.optionalUnlockAfterAreaId && player.clearedAreas.includes(area.optionalUnlockAfterAreaId)) {
    return true;
  }

  return false;
}

/**
 * Get status icon for an area
 */
function getAreaStatusIcon(isUnlocked: boolean, isCleared: boolean): string {
  if (!isUnlocked) return '🔒';
  if (isCleared) return '✅';
  return '📍';
}

/**
 * Get button text for stage selection
 */
function getButtonText(isCurrent: boolean, isUnlocked: boolean): string {
  if (isCurrent) return '現在のステージ';
  if (isUnlocked) return 'このステージへ';
  return '未開放';
}

/**
 * Individual stage item component
 */
function StageItem({
  area,
  player,
  onSelect,
}: {
  area: AreaInfo;
  player: Player;
  onSelect: (areaId: number) => void;
}) {
  const isUnlocked = isAreaUnlocked(area, player);
  const isCleared = player.clearedAreas.includes(area.id);
  const isCurrent = player.currentArea === area.id;
  const statusIcon = getAreaStatusIcon(isUnlocked, isCleared);
  const buttonText = getButtonText(isCurrent, isUnlocked);

  return (
    <div
      className={`stageItem ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
    >
      <div className="stageHeader">
        <h4>
          {statusIcon} {area.name}{' '}
          {area.mainline === false && (
            <span className="stageBadge" style={{ marginLeft: 6 }}>任意</span>
          )}
        </h4>
        {isCurrent && <span className="stageBadge">現在地</span>}
      </div>
      <p className="stageDesc">{area.description}</p>
      <div className="stageBoss">
        ボス: {area.bossName} {isCleared ? '(撃破済み)' : ''}
      </div>
      <button
        onClick={() => onSelect(area.id)}
        disabled={!isUnlocked || isCurrent}
        className={!isUnlocked ? 'disabled' : ''}
      >
        {buttonText}
      </button>
    </div>
  );
}

/**
 * Individual floor item component for endless mode
 */
function FloorItem({
  floor,
  player,
  onSelect,
}: {
  floor: number;
  player: Player;
  onSelect: (floor: number) => void;
}) {
  const currentFloor = player.endlessFloor || 1;
  const isCurrent = currentFloor === floor;

  return (
    <div
      className={`stageItem unlocked ${isCurrent ? 'current' : ''}`}
    >
      <div className="stageHeader">
        <h4>
          🏔️ 第{floor}階層
        </h4>
        {isCurrent && <span className="stageBadge">現在地</span>}
      </div>
      <button
        onClick={() => onSelect(floor)}
        disabled={isCurrent}
      >
        {isCurrent ? '現在の階層' : 'この階層へ'}
      </button>
    </div>
  );
}

export default function StageSelectOverlay() {
  // Get state and actions from Context
  const { showStageSelect, player, gameMode } = useGameState();
  const { setShowStageSelect, changeStage, changeFloor } = useGameActions();

  if (!showStageSelect) return null;

  // 無限の回廊モードの場合は階層選択UI
  if (gameMode === 'endless') {
    const maxFloor = player.endlessFloor || 1;
    const floors = Array.from({ length: maxFloor }, (_, i) => i + 1);

    return (
      <Overlay title="階層選択" onClose={() => setShowStageSelect(false)}>
        <div className="stageSelect">
          <p>🏔️ 移動先の階層を選択してください</p>
          <div className="stageList">
            {floors.map((floor) => (
              <FloorItem
                key={floor}
                floor={floor}
                player={player}
                onSelect={changeFloor}
              />
            ))}
          </div>
          <div className="gBtns">
            <button className="ghost" onClick={() => setShowStageSelect(false)}>閉じる</button>
          </div>
        </div>
      </Overlay>
    );
  }

  // ストーリーモードまたはライブラリモードの場合はエリア選択UI（Area 10は除外）
  const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
  const selectableAreas = currentAreas.filter(a => a.id !== 10);

  return (
    <Overlay title="ステージ選択" onClose={() => setShowStageSelect(false)}>
      <div className="stageSelect">
        <p>🗺️ 移動先のステージを選択してください</p>
        <div className="stageList">
          {selectableAreas.map((area) => (
            <StageItem
              key={area.id}
              area={area}
              player={player}
              onSelect={changeStage}
            />
          ))}
        </div>
        <div className="gBtns">
          <button className="ghost" onClick={() => setShowStageSelect(false)}>閉じる</button>
        </div>
      </div>
    </Overlay>
  );
}
