import React from 'react';
import { GameMode } from '../../lib/gameTypes';
import { AreaInfo } from '../../lib/world/areas';
import { UI_COLORS } from '../../lib/ui/constants';
import { AREA_INFO_STYLE, CLEAR_CONDITION_BASE_STYLE } from '../styles/constants';

interface AreaBannerState {
  state: 'target' | 'cleared' | 'bossRoom';
  bossName: string;
}

interface MapInfoPanelProps {
  currentAreaInfo: AreaInfo;
  gameMode: GameMode;
  playerFloor: number | undefined;
  areaBannerState: AreaBannerState;
}

/**
 * マップ情報パネル - エリア名とクリア条件を表示
 *
 * 純粋な表示コンポーネント。
 *
 * @param props - 表示に必要な情報
 */
export default function MapInfoPanel({
  currentAreaInfo,
  gameMode,
  playerFloor,
  areaBannerState
}: MapInfoPanelProps) {
  return (
    <>
      <div className="areaInfo" style={AREA_INFO_STYLE}>
        📍 {currentAreaInfo.name}
        {gameMode === 'endless' ? ` - 第${playerFloor || 1}階層` : ''}
        {gameMode === 'story' ? ` - ${currentAreaInfo.description}` : ''}
      </div>
      <div className="clearCondition" style={{
        ...CLEAR_CONDITION_BASE_STYLE,
        background: areaBannerState.state === 'bossRoom' ? UI_COLORS.PURPLE : (areaBannerState.state === 'cleared' ? UI_COLORS.GREEN : UI_COLORS.ORANGE)
      }}>
        {areaBannerState.state === 'bossRoom' ? (
          <>⚔️ ここはボスの間：歩くと歴代ボス（虚空の王を含む）が出現します</>
        ) : areaBannerState.state === 'cleared' ? (
          <>✅ クリア済み：{areaBannerState.bossName}を倒した！</>
        ) : (
          <>🎯 クリア条件：城で「{areaBannerState.bossName}」を倒す</>
        )}
      </div>
    </>
  );
}
