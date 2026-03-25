import React from 'react';
import Overlay from '../../components/Overlay';
import { WEAPONS, ULTIMATE_WEAPON, ARMORS, ULTIMATE_ARMOR } from '../../lib/equipment';
import { UI_COLORS } from '../../lib/ui/constants';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function EquipDexOverlay() {
  // Get state and actions from Context
  const { showEquipDex, equipDex, player } = useGameState();
  const { setShowEquipDex, setPlayer } = useGameActions();

  if (!showEquipDex) return null;

  // 武器を強さ順（ATK順）にソート
  const sortedWeapons = [...equipDex.weapons].sort((a, b) => {
    const weaponA = WEAPONS.find(x => x.name === a) || (a === ULTIMATE_WEAPON.name ? ULTIMATE_WEAPON : undefined);
    const weaponB = WEAPONS.find(x => x.name === b) || (b === ULTIMATE_WEAPON.name ? ULTIMATE_WEAPON : undefined);
    if (!weaponA || !weaponB) return 0;
    return weaponA.atk - weaponB.atk;
  });

  // 防具を強さ順（DEF順）にソート
  const sortedArmors = [...equipDex.armors].sort((a, b) => {
    const armorA = ARMORS.find(x => x.name === a) || (a === ULTIMATE_ARMOR.name ? ULTIMATE_ARMOR : undefined);
    const armorB = ARMORS.find(x => x.name === b) || (b === ULTIMATE_ARMOR.name ? ULTIMATE_ARMOR : undefined);
    if (!armorA || !armorB) return 0;
    return armorA.def - armorB.def;
  });

  return (
    <Overlay title="装備図鑑（取得済み）" onClose={() => setShowEquipDex(false)}>
      <div className="dex">
        <h5>武器</h5>
        <div className="shopList">
          {sortedWeapons.length === 0 && <div style={{ opacity: 0.7, fontSize: 13 }}>何も登録されていません</div>}
          {sortedWeapons.map(name => {
            const w = WEAPONS.find(x => x.name === name) || (name === ULTIMATE_WEAPON.name ? ULTIMATE_WEAPON : undefined);
            if (!w) return <div key={name}>{name}</div>;
            const isEquipped = player.equip.weapon.name === w.name;
            return (
              <div className="shopRow" key={w.name}>
                <span>{w.name}（ATK+{w.atk}）{isEquipped && <em style={{ marginLeft: 8, color: UI_COLORS.GOLD_UPPER }}>装備中</em>}</span>
                <button disabled={isEquipped} onClick={() => setPlayer(p => ({ ...p, equip: { ...p.equip, weapon: w } }))}>装備する</button>
              </div>
            );
          })}
        </div>
        <h5 style={{ marginTop: 12 }}>防具</h5>
        <div className="shopList">
          {sortedArmors.length === 0 && <div style={{ opacity: 0.7, fontSize: 13 }}>何も登録されていません</div>}
          {sortedArmors.map(name => {
            const a = ARMORS.find(x => x.name === name) || (name === ULTIMATE_ARMOR.name ? ULTIMATE_ARMOR : undefined);
            if (!a) return <div key={name}>{name}</div>;
            const isEquipped = player.equip.armor.name === a.name;
            return (
              <div className="shopRow" key={a.name}>
                <span>{a.name}（DEF+{a.def}）{isEquipped && <em style={{ marginLeft: 8, color: UI_COLORS.GOLD_UPPER }}>装備中</em>}</span>
                <button disabled={isEquipped} onClick={() => setPlayer(p => ({ ...p, equip: { ...p.equip, armor: a } }))}>装備する</button>
              </div>
            );
          })}
        </div>
        <div className="gBtns">
          <button className="ghost" onClick={() => setShowEquipDex(false)}>閉じる</button>
        </div>
      </div>
    </Overlay>
  );
}
