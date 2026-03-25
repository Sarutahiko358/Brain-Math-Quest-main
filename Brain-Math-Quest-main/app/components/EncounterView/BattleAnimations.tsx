/**
 * Battle Animation Components
 * Separates animation rendering logic from main EncounterView
 * Reduces complexity by handling each animation type independently
 */

import React from 'react';

interface BattleAnimationsProps {
  battleAnim: { type: string; value?: number } | null;
}

/**
 * Renders all battle animation effects based on animation type
 * Centralizes animation rendering logic for better maintainability
 */
export default function BattleAnimations({ battleAnim }: BattleAnimationsProps) {
  if (!battleAnim) return null;

  return (
    <>
      {/* Damage number display */}
      {battleAnim.type === 'damage' && battleAnim.value && (
        <div
          className="damageNumber"
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          -{battleAnim.value}
        </div>
      )}

      {/* Combo damage display (more flashy) */}
      {battleAnim.type === 'bonusCombo' && battleAnim.value && (
        <div
          className="damageNumber critical"
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          -{battleAnim.value}
        </div>
      )}

      {/* Heal display */}
      {battleAnim.type === 'heal' && battleAnim.value && (
        <div
          className="damageNumber heal"
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          +{battleAnim.value}
        </div>
      )}

      {/* Level up animation */}
      {battleAnim.type === 'levelup' && (
        <>
          <div className="levelupRing" />
          <div
            className="bonusEffect"
            style={{
              position: 'absolute',
              top: '12%',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'var(--good)',
              fontWeight: 800
            }}
          >
            🎉 LEVEL UP!
          </div>
          <div className="starSparkle" style={{ top: '8%', left: '40%' }}>✦</div>
          <div className="starSparkle" style={{ top: '18%', left: '62%', animationDelay: '0.1s' }}>✧</div>
          <div className="starSparkle" style={{ top: '4%', left: '58%', animationDelay: '0.2s' }}>✦</div>
        </>
      )}

      {/* Speed bonus effect */}
      {battleAnim.type === 'bonusSpeed' && (
        <div
          className="bonusEffect speed"
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          ⚡速解き!
        </div>
      )}

      {/* Hard question bonus effect */}
      {battleAnim.type === 'bonusHard' && (
        <div
          className="bonusEffect hard"
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          🧩難問!
        </div>
      )}

      {/* Combo bonus effect (text only, value shown in combo damage) */}
      {battleAnim.type === 'bonusCombo' && (
        <div
          className="bonusEffect combo"
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          🔥COMBO!
        </div>
      )}
    </>
  );
}
