// filepath: /home/user/Brain-Math-Quest/app/components/result/VictoryRewards.tsx
"use client";

import React from "react";
import { BattleState } from "../../lib/gameTypes";
import {
  REWARD_ITEM_STYLE,
  REWARD_ITEM_TITLE_STYLE,
  REWARD_ITEM_TEXT_STYLE,
} from '../constants/result';

interface VictoryRewardsProps {
  battle: BattleState;
}

/**
 * Victory rewards display (exp, gold, items, level up)
 */
export default function VictoryRewards({ battle }: VictoryRewardsProps) {
  if (!battle.rewards) return null;

  return (
    <div className="rewards" role="region" aria-label="戦闘報酬">
      <div className="rewardTitle" role="heading" aria-level={2}>― 戦闘結果 ―</div>
      <div className="rewardItem">✨ 経験値：<strong>+{battle.rewards.exp}</strong></div>
      <div className="rewardItem">💰 ゴールド：<strong>+{battle.rewards.gold}</strong></div>

      {battle.rewards.timeBonus && battle.rewards.timeBonus > 0 && (
        <div className="rewardItem timeBonusItem">⚡ タイムボーナス：<strong>+{battle.rewards.timeBonus}</strong></div>
      )}

      {battle.rewards.items && battle.rewards.items.length > 0 && (
        <div className="rewardItem" style={REWARD_ITEM_STYLE}>
          <div style={REWARD_ITEM_TITLE_STYLE}>🎁 獲得アイテム：</div>
          {battle.rewards.items.map((item, i) => (
            <div key={i} style={REWARD_ITEM_TEXT_STYLE}>{item}</div>
          ))}
        </div>
      )}

      {battle.rewards.levelUp && (
        <div className="levelUpBox">
          <div className="levelUpTitle">🎉 レベルアップ！</div>
          <div className="levelUpDetail">Lv {battle.rewards.levelUp.oldLv} → Lv {battle.rewards.levelUp.newLv}</div>
          <div className="levelUpStats">
            <span>HP +{battle.rewards.levelUp.hpGain}</span>
            <span>MP +{battle.rewards.levelUp.mpGain}</span>
            <span>ATK +{battle.rewards.levelUp.atkGain}</span>
            <span>DEF +{battle.rewards.levelUp.defGain}</span>
          </div>
          {battle.rewards.levelUpDetails && battle.rewards.levelUpDetails.length > 0 && (
            <div className="levelUpList" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
              {battle.rewards.levelUpDetails.map((d, i) => (
                <div key={i}>・Lv{d.fromLv} → Lv{d.toLv}：HP +{d.hp} / MP +{d.mp} / ATK +{d.atk} / DEF +{d.def}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
