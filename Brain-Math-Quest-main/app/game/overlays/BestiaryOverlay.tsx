import React from 'react';
import Image from 'next/image';
import Overlay from '../../components/Overlay';
import { ENEMY_POOL, BOSS_POOL } from '../../lib/enemies';
import { UI_COLORS } from '../../lib/ui/constants';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function BestiaryOverlay() {
  // Get state and actions from Context
  const { showDex, gameMode, dexStory, dexEndless } = useGameState();
  const { setShowDex } = useGameActions();

  if (!showDex) return null;

  return (
    <Overlay title="魔物図鑑" onClose={() => setShowDex(false)}>
      <div className="dex">
        {[...ENEMY_POOL, ...BOSS_POOL].map((enemy) => {
          const rec = (gameMode === 'endless' ? dexEndless : dexStory)[enemy.name] || { seen: 0, defeated: 0 };
          const encountered = rec.seen > 0;
          return (
            <div className="dexRow" key={enemy.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 画像 or ？ */}
              <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: UI_COLORS.SEMI_TRANSPARENT_BG, borderRadius: 8 }}>
                {encountered && enemy.imageUrl ? (
                  <Image src={enemy.imageUrl} alt={enemy.name} width={48} height={48} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                ) : (
                  <span style={{ fontSize: 32, color: UI_COLORS.GRAY }}>？</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="dexName" style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {encountered ? enemy.name : '？？？？？'}
                  {rec.defeated >= 4 && encountered && (
                    <span style={{ marginLeft: 6, color: UI_COLORS.GOLD_UPPER, fontWeight: 800 }}>
                      <span aria-hidden="true" style={{ display: 'inline-block', transform: 'translateY(-1px)', marginRight: 2 }}>👑</span>
                      討伐マスター
                    </span>
                  )}
                </div>
                {gameMode === 'story' && (
                  <div className="dexMeta" style={{ fontSize: 13, opacity: 0.85 }}>
                    出現エリア: {enemy.area ? `エリア${enemy.area}` : '???'}
                  </div>
                )}
                <div className="dexMeta" style={{ fontSize: 13, opacity: 0.85 }}>
                  たおした数: {rec.defeated}
                </div>
                <div className="dexBar">
                  <div className="dexFill" style={{ width: `${Math.min(100, rec.defeated * 25)}%`, boxShadow: rec.defeated >= 4 ? `0 0 8px ${UI_COLORS.GOLD_UPPER}` : undefined }} />
                </div>
              </div>
            </div>
          );
        })}
        <div className="gBtns">
          <button className="ghost" onClick={() => setShowDex(false)}>閉じる</button>
        </div>
      </div>
    </Overlay>
  );
}
