"use client";

import React from "react";
import Image from 'next/image';
import { Enemy } from "../lib/enemies";
import { UI_COLORS } from "../lib/ui/constants";
import BattleAnimations from "./EncounterView/BattleAnimations";
import { getEnemyImageFilter, getEnemyImageSize, getEnemyEmojiSize } from "./EncounterView/imageFilters";

interface EncounterViewProps {
  enemy: Enemy;
  battleMode: "quiz" | "select" | "selectSkill" | "selectFireList" | "selectHealList" | "selectItem" | "queue" | "victory" | string;
  battleAnim: { type: string; value?: number } | null;
  enemyImageError: boolean;
  battlePanelBgStyle: React.CSSProperties;
  enemyPanelRef: React.RefObject<HTMLDivElement>;
  onLogClick: () => void;
  onEnemyImageError: () => void;
}

/**
 * EncounterView - Display-only component for enemy panel in battle
 * Shows enemy image/emoji, HP, animations, and effects
 * Props-based, animation state managed by parent
 *
 * Refactored: Reduced complexity by extracting image filters and animations
 */
export default function EncounterView({
  enemy,
  battleMode,
  battleAnim,
  enemyImageError,
  battlePanelBgStyle,
  enemyPanelRef,
  onLogClick,
  onEnemyImageError,
}: EncounterViewProps) {
  const imageSize = getEnemyImageSize(enemy);
  const emojiSize = getEnemyEmojiSize(enemy);
  const imageFilter = getEnemyImageFilter(enemy.name);
  return (
    <div
      className={`enemy ${battleAnim?.type === 'damage' ? 'shake' : ''} ${battleAnim?.type === 'playerHit' ? 'flash' : ''}`}
      style={battlePanelBgStyle}
      ref={enemyPanelRef}
      role="region"
      aria-label="敵キャラクター"
    >
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%'}}>
        <div
          className={`ename bossBanner ${enemy.name === '九尾の麒麟' ? 'kirin' : ''}`}
          role="heading"
          aria-level={2}
          style={{
            textAlign: 'center',
            marginTop: 0,
            marginBottom: 8,
            display: 'inline-block',
            padding: '6px 10px',
            borderRadius: 12,
            background: 'rgba(12,19,48,0.80)',
            border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
            boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
          }}
        >
          {enemy.name}{enemy.boss ? " 👑" : ""}
        </div>
        {enemy.imageUrl && !enemyImageError ? (
          <div className="enemyImage" style={{
            position: 'relative',
            width: imageSize.width,
            height: imageSize.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <Image
              src={enemy.imageUrl}
              alt={enemy.name}
              fill
              sizes={(enemy.renderSize ? `${imageSize.width}px` : '256px')}
              priority
              style={{
                objectFit: 'contain',
                imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
                display: 'block',
                margin: '0 auto',
                ...imageFilter
              }}
              onError={onEnemyImageError}
            />
          </div>
        ) : (
          <div className="enemyEmoji" style={{
            fontSize: `${emojiSize}px`,
            margin: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {enemy.emoji}
          </div>
        )}
      </div>
      <div style={{width:'100%',position:'absolute',bottom:0,left:0,display:'flex',flexDirection:'column',alignItems:'center',paddingBottom:18}}>
        <div
          className="ehp"
          role="status"
          aria-live="polite"
          aria-label={`敵のHP ${enemy.hp} / ${enemy.maxHP}`}
          style={{
            textAlign: 'center',
            marginTop: 0,
            display: 'inline-block',
            padding: '5px 10px',
            borderRadius: 10,
            background: 'rgba(12,19,48,0.88)',
            border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.30)',
          }}
        >
          HP {enemy.hp}/{enemy.maxHP}
        </div>
        {battleMode === "queue" && (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            <button onClick={onLogClick} aria-label="続ける - 次に進む">▶ 続ける</button>
          </div>
        )}
      </div>
      {/* All battle animations extracted to separate component */}
      <BattleAnimations battleAnim={battleAnim} />
    </div>
  );
}
