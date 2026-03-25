"use client";

import React from "react";
import { Player } from "../lib/gameTypes";
import { effATK, effDEF } from "../lib/battle/stats";
import { nextExpFor } from "../lib/battle/xp";
import { UI_COLORS } from "../lib/ui/constants";

interface StatusBarProps {
  player: Player;
  quizCombo: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  statusOpacity: number;
  statusSize: number;
  detailRef: React.RefObject<HTMLDivElement>;
}

/**
 * StatusBar - Display-only component for player status on map scene
 * Shows collapsed mini-bar and expandable detailed stats
 * Props-based, no side effects
 */
export default function StatusBar({
  player,
  quizCombo,
  expanded,
  onToggleExpanded,
  statusOpacity,
  statusSize,
  detailRef,
}: StatusBarProps) {
  return (
    <div
      className="topStatusWrap"
      role="region"
      aria-label="プレイヤーステータス"
      style={{
        marginTop: 8,
        opacity: statusOpacity,
        transition: 'opacity 0.2s, font-size 0.2s',
      }}
    >
      <div className="topStatusBar">
        <button className="ghost" aria-label={expanded ? 'ステータス詳細を折りたたむ' : 'ステータス詳細を展開'} onClick={onToggleExpanded}>
          {expanded ? '▲' : '▼'}
        </button>
        <div
          className="topStatusMini"
          role="status"
          aria-live="polite"
          style={{
            fontSize: `${Math.round(14 * (statusSize / 100) * 0.9)}px`
          }}
        >
          <span style={{ marginRight: 8 }} aria-label="アバター">{player.avatar}</span>
          <span aria-label={`レベル ${player.lv}`}>Lv{player.lv}</span>
          <span style={{ margin: '0 8px' }} aria-label={`HP ${player.hp} / ${player.maxHP}`}>HP {player.hp}/{player.maxHP}</span>
          <span aria-label={`MP ${player.mp} / ${player.maxMP}`}>MP {player.mp}/{player.maxMP}</span>
          {quizCombo > 0 && (
            <span style={{ margin: '0 8px', color: UI_COLORS.GOLD, fontWeight: 'bold' }} aria-label={`コンボ ${quizCombo}連鎖`}>
              🔥×{quizCombo}
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div
          className="topStatusDetail"
          ref={detailRef}
          role="region"
          aria-label="ステータス詳細情報"
          style={{
            fontSize: `${Math.round(14 * (statusSize / 100) * 0.8)}px`
          }}
        >
          <div className="statusLine nowrap">HP {player.hp}/{player.maxHP} MP {player.mp}/{player.maxMP}</div>
          <div className="statusLine">ATK {effATK(player)}（主人公 {player.baseATK} + 装備 {player.equip.weapon.atk}：{player.equip.weapon.name}）</div>
          <div className="statusLine">DEF {effDEF(player)}（主人公 {player.baseDEF} + 装備 {player.equip.armor.def}：{player.equip.armor.name}）</div>
          <div className="statusLine nowrap">EXP {player.exp}/{nextExpFor(player.lv)} GOLD {player.gold}</div>
          {quizCombo > 0 && (
            <div className="statusLine" style={{ marginTop: 4, color: UI_COLORS.GOLD, fontWeight: 'bold' }}>
              🔥 連続コンボ：×{quizCombo}{player.equip.accessory?.comboPlus ? ` (+${player.equip.accessory.comboPlus})` : ''}
              {' '}
              {(() => { const p = player.equip.accessory?.comboPlus || 0; return `（攻撃力ボーナス +${Math.floor((quizCombo + p + 1) * 1.6)} 〜 +${Math.floor((quizCombo + p + 1) * 2.2)}）`; })()}
            </div>
          )}
          {(player.flags?.comboGuard || 0) > 0 && (
            <div className="statusLine" style={{ marginTop: 4 }}>
              🛡 コンボ保護：<strong>{player.flags!.comboGuard}</strong>/8
            </div>
          )}
          <div className="statusLine" style={{ marginTop: 4 }}>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join('、') || 'なし'}</div>
        </div>
      )}
    </div>
  );
}
