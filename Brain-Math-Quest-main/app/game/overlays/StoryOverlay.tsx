import React, { useMemo } from 'react';
import Overlay from '../../components/Overlay';
import { Player, GameMode } from '../../lib/gameTypes';
import { AREAS, AreaInfo, createRandomMap } from '../../lib/world/areas';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';
import { ENDLESS_CONFIG, generateFloorStory } from '../../lib/world/endless';
import { UI_COLORS } from '../../lib/ui/constants';
import { useGameState, useGameActions } from '../contexts/GameContext';

/**
 * Check if all four guardian bosses have been defeated
 */
function allGuardiansDefeated(player: Player): boolean {
  return !!(
    player.flags?.genbuDefeated &&
    player.flags?.seiryuDefeated &&
    player.flags?.suzakuDefeated &&
    player.flags?.byakkoDefeated
  );
}

/**
 * Check if player can proceed to next area
 */
function canProceedToNextArea(player: Player, gameMode: GameMode): boolean {
  const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;

  // Already at last area
  if (player.currentArea >= currentAreas.length) return false;

  // Area 7 requires all guardians defeated (for both story and library modes)
  if (player.currentArea === 7 && !allGuardiansDefeated(player)) return false;

  // Area 9 is the final area
  if (player.currentArea === 9) return false;

  return true;
}

/**
 * Advance player to next area with full HP/MP
 */
function advanceToNextArea(
  player: Player,
  gameMode: GameMode,
  setPlayer: ReturnType<typeof useGameActions>['setPlayer'],
  setShowStory: ReturnType<typeof useGameActions>['setShowStory'],
  setScene: ReturnType<typeof useGameActions>['setScene'],
  addToast: ReturnType<typeof useGameActions>['addToast']
): void {
  const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
  const nextAreaId = player.currentArea + 1;
  const nextArea = currentAreas.find(a => a.id === nextAreaId);

  setPlayer(p => ({
    ...p,
    currentArea: nextAreaId,
    pos: nextArea?.startPos || { r: 4, c: 2 },
    hp: p.maxHP,
    mp: p.maxMP
  }));

  setShowStory(null);
  setScene?.("map");
  addToast(`次のエリア「${nextArea?.name}」へ！`);
}

export default function StoryOverlay() {
  // Get state and actions from Context
  const { showStory, gameMode, player } = useGameState();
  const { setShowStory, setPlayer, setScene, addToast } = useGameActions();

  const currentAreaInfo = useMemo(() =>
    gameMode === 'endless'
      ? {
        id: player.currentArea,
        ...ENDLESS_CONFIG,
        map: createRandomMap(player.endlessFloor || 1),
        bossDefeated: false,
        mainline: false
      } as AreaInfo
      : (() => {
        const currentAreas = gameMode === 'library' ? LIBRARY_AREAS : AREAS;
        return currentAreas.find(a => a.id === player.currentArea) || currentAreas[0];
      })(),
    [gameMode, player.currentArea, player.endlessFloor]
  );

  if (!showStory) return null;

  return (
    <Overlay title="📖 ストーリー" onClose={() => setShowStory(null)}>
      <div className={showStory === 'bossVictory' ? 'fade-in' : undefined} style={{ padding: '20px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
        {showStory === "intro" && (
          gameMode === 'endless'
            ? generateFloorStory(player.endlessFloor || 1)
            : currentAreaInfo.story.intro
        )}
        {showStory === "bossEncounter" && currentAreaInfo.story.bossEncounter}
        {showStory === "bossVictory" && (
          <>
            <div>{currentAreaInfo.story.victory}</div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              {canProceedToNextArea(player, gameMode) ? (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => advanceToNextArea(player, gameMode, setPlayer, setShowStory, setScene, addToast)}>
                    次のエリアへ進む
                  </button>
                  <button className="ghost" onClick={() => {
                    setShowStory(null);
                    setScene("map");
                  }}>
                    このエリアに留まる
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: UI_COLORS.GOLD_UPPER }}>
                  🎉 全エリアクリア！おめでとうございます！ 🎉
                </div>
              )}
            </div>
          </>
        )}
        {showStory === "victory" && (
          <>
            <div>エリア「{currentAreaInfo.name}」をクリアしました！</div>
            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {canProceedToNextArea(player, gameMode) && (
                <button onClick={() => advanceToNextArea(player, gameMode, setPlayer, setShowStory, setScene, addToast)}>
                  次のエリアへ進む
                </button>
              )}
              <button className="ghost" onClick={() => setShowStory(null)}>
                このエリアに留まる
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}
