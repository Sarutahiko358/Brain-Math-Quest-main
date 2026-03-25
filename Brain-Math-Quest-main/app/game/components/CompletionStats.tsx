import React, { useState } from 'react';
import { Player, GameMode } from '../../lib/gameTypes';
import { DexData, EquipDexState } from '../types';
import { computeCompletionStats } from '../utils';
import { UI_COLORS } from '../../lib/ui/constants';
import { WEAPONS, ULTIMATE_WEAPON, ARMORS, ULTIMATE_ARMOR } from '../../lib/equipment';

interface CompletionStatsProps {
  player: Player;
  gameMode: GameMode;
  dexStory: DexData;
  dexEndless: DexData;
  quizCombo: number;
  equipDex: EquipDexState;
}

// Helper: Render completion badge
function CompletionBadge({ isComplete }: { isComplete: boolean }) {
  return isComplete ? <>（コンプリート）</> : null;
}

// Helper: Render complete message
function CompleteMessage({ isComplete }: { isComplete: boolean }) {
  return isComplete ? <>（コンプリート！）</> : null;
}

// Helper: Render story completion rate
function StoryCompletionRate({ completion }: { completion: number }) {
  const isComplete = completion === 100;
  const color = isComplete ? UI_COLORS.GOLD_UPPER : UI_COLORS.GREEN;

  return (
    <p>
      🎯 総合達成率：<strong style={{ color }}>{completion}%</strong>
      <CompleteMessage isComplete={isComplete} />
    </p>
  );
}

// Helper: Render area progress
function AreaProgress({ gameMode, clearedAreas, mainlineAreas, areasDone }: {
  gameMode: GameMode;
  clearedAreas: number;
  mainlineAreas: number | '∞';
  areasDone: boolean;
}) {
  if (gameMode === 'endless') {
    return <p>🗺️ 到達階層：第{clearedAreas + 1}階層</p>;
  }

  return (
    <p style={{ color: areasDone ? UI_COLORS.GOLD_UPPER : undefined }}>
      🗺️ エリアクリア：{clearedAreas}/{mainlineAreas}（メイン）
      <CompletionBadge isComplete={areasDone} />
    </p>
  );
}

// Helper: Render combo info
function ComboInfo({ quizCombo, player }: { quizCombo: number; player: Player }) {
  if (quizCombo === 0) return null;

  const comboPlus = player.equip.accessory?.comboPlus;
  const bonusText = comboPlus ? ` (+${comboPlus})` : '';

  return (
    <p>
      🔥 現在コンボ：<strong style={{ color: UI_COLORS.GOLD_UPPER }}>×{quizCombo}{bonusText}</strong>
    </p>
  );
}

// Helper: Render combo guard info
function ComboGuardInfo({ player }: { player: Player }) {
  const guardCount = player.flags?.comboGuard || 0;
  if (guardCount === 0) return null;

  return <p>🛡 コンボ保護：<strong>{guardCount}</strong>/8</p>;
}

// Helper: Five Spirit Treasures detail list
function FiveTreasuresDetail({ player }: { player: Player }) {
  const treasures = [
    { name: "繁盛の青木宝", guardian: "青龍" },
    { name: "繁栄の白金石", guardian: "白虎" },
    { name: "隆盛の朱火玉", guardian: "朱雀" },
    { name: "守護の黒水鉱", guardian: "玄武" },
    { name: "鎮静の黄土珠", guardian: "麒麟" },
  ];

  return (
    <div style={{ marginLeft: '1em', fontSize: '12px', marginTop: '4px' }}>
      {treasures.map(treasure => {
        const owned = player.keyItems.includes(treasure.name);
        return (
          <div key={treasure.name} style={{ color: owned ? UI_COLORS.GREEN : '#999' }}>
            {owned ? '✅' : '❌'} {treasure.name}（{treasure.guardian}）
          </div>
        );
      })}
    </div>
  );
}

// Helper: Weapons detail list
function WeaponsDetail({ equipDex }: { equipDex: EquipDexState }) {
  const allWeapons = [...WEAPONS, ULTIMATE_WEAPON];

  return (
    <div style={{ marginLeft: '1em', fontSize: '12px', marginTop: '4px' }}>
      {allWeapons.map(weapon => {
        const owned = equipDex.weapons.includes(weapon.name);
        return (
          <div key={weapon.name} style={{ color: owned ? UI_COLORS.GREEN : '#999' }}>
            {owned ? '✅' : '❌'} {weapon.name}
          </div>
        );
      })}
    </div>
  );
}

// Helper: Armors detail list
function ArmorsDetail({ equipDex }: { equipDex: EquipDexState }) {
  const allArmors = [...ARMORS, ULTIMATE_ARMOR];

  return (
    <div style={{ marginLeft: '1em', fontSize: '12px', marginTop: '4px' }}>
      {allArmors.map(armor => {
        const owned = equipDex.armors.includes(armor.name);
        return (
          <div key={armor.name} style={{ color: owned ? UI_COLORS.GREEN : '#999' }}>
            {owned ? '✅' : '❌'} {armor.name}
          </div>
        );
      })}
    </div>
  );
}

export default function CompletionStats({ player, gameMode, dexStory, dexEndless, quizCombo, equipDex }: CompletionStatsProps) {
  const stats = computeCompletionStats({ player, gameMode, dexStory, dexEndless });
  const { defeatedBosses, totalBosses, defeatedEnemies, totalEnemies, clearedAreas, mainlineAreas, completion, bossesDone, areasDone, defeatedDone, allDone } = stats;

  const five = ["繁盛の青木宝","繁栄の白金石","隆盛の朱火玉","守護の黒水鉱","鎮静の黄土珠"];
  const owned = five.filter(n => player.keyItems.includes(n)).length;
  const fiveDone = owned >= five.length;

  // 武器・防具のコンプリート状況
  const totalWeapons = WEAPONS.length + 1; // +1 for ULTIMATE_WEAPON
  const totalArmors = ARMORS.length + 1; // +1 for ULTIMATE_ARMOR
  const weaponsDone = equipDex.weapons.length >= totalWeapons;
  const armorsDone = equipDex.armors.length >= totalArmors;

  // 開閉状態管理
  const [showWeapons, setShowWeapons] = useState(false);
  const [showArmors, setShowArmors] = useState(false);
  const [showTreasures, setShowTreasures] = useState(false);

  return (
    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
      {gameMode === 'story' && <StoryCompletionRate completion={completion} />}

      <p style={{ color: bossesDone ? UI_COLORS.GOLD_UPPER : undefined }}>
        🏆 ボス撃破：{defeatedBosses}/{totalBosses}<CompletionBadge isComplete={bossesDone} />
      </p>

      <AreaProgress
        gameMode={gameMode}
        clearedAreas={clearedAreas}
        mainlineAreas={mainlineAreas}
        areasDone={areasDone}
      />

      <div>
        <p
          style={{
            color: weaponsDone ? UI_COLORS.GOLD_UPPER : undefined,
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setShowWeapons(!showWeapons)}
        >
          ⚔️ 武器コンプリート：{equipDex.weapons.length}/{totalWeapons}<CompletionBadge isComplete={weaponsDone} /> {showWeapons ? '▲' : '▼'}
        </p>
        {showWeapons && <WeaponsDetail equipDex={equipDex} />}
      </div>

      <div>
        <p
          style={{
            color: armorsDone ? UI_COLORS.GOLD_UPPER : undefined,
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setShowArmors(!showArmors)}
        >
          🛡️ 防具コンプリート：{equipDex.armors.length}/{totalArmors}<CompletionBadge isComplete={armorsDone} /> {showArmors ? '▲' : '▼'}
        </p>
        {showArmors && <ArmorsDetail equipDex={equipDex} />}
      </div>

      <p style={{ color: defeatedDone ? UI_COLORS.GOLD_UPPER : undefined }}>
        📖 モンスター図鑑登録：{defeatedEnemies}/{totalEnemies}<CompletionBadge isComplete={defeatedDone} />
      </p>

      <div>
        <p
          style={{
            color: fiveDone ? UI_COLORS.GOLD_UPPER : undefined,
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setShowTreasures(!showTreasures)}
        >
          🪬 五霊宝コンプリート：{owned}/{five.length}<CompletionBadge isComplete={fiveDone} /> {showTreasures ? '▲' : '▼'}
        </p>
        {showTreasures && <FiveTreasuresDetail player={player} />}
      </div>

      {allDone && (
        <p style={{ color: UI_COLORS.GOLD_UPPER, fontWeight: 700 }}>🏁 すべてコンプリート達成！</p>
      )}

      <ComboInfo quizCombo={quizCombo} player={player} />
      <ComboGuardInfo player={player} />
    </div>
  );
}
