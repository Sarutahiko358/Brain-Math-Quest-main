import React from 'react';
import Overlay from '../../components/Overlay';
import { Player, Weapon, Armor, Tool } from '../../lib/gameTypes';
import { EquipDexState } from '../types';
import { WEAPONS, ARMORS, TOOLS } from '../../lib/equipment';
import { useGameState, useGameActions } from '../contexts/GameContext';
import { healAtInnCost, getShopAssortment } from '../utils';

/**
 * Get tool effect description
 */
function getToolEffectDescription(tool: Tool): string {
  switch (tool.effect) {
    case "heal": return `HP回復+${tool.amount}`;
    case "mp": return `MP回復+${tool.amount}`;
    case "comboUp": return `コンボ+${tool.amount}`;
    case "comboGuard": return `コンボ維持（次のミス${tool.amount}回）`;
    default: return '';
  }
}

/**
 * Town main menu component
 */
function TownMenuView({
  player,
  healCost,
  onSelectWeapon,
  onSelectTool,
  onSelectInn,
  onExit,
}: {
  player: Player;
  healCost: number;
  onSelectWeapon: () => void;
  onSelectTool: () => void;
  onSelectInn: () => void;
  onExit: () => void;
}) {
  return (
    <div className="townMenu">
      <p>ようこそ、旅の方！今日は 何を お求めですか？（所持金 {player.gold}G）</p>
      <div className="gBtns">
        <button onClick={onSelectWeapon}>🔪 武器・防具屋</button>
        <button onClick={onSelectTool}>🧪 道具屋</button>
        <button onClick={onSelectInn}>🛏️ 宿屋（{healCost}G）</button>
        <button onClick={onExit}>出る</button>
      </div>
    </div>
  );
}

/**
 * Shop assortment info component
 */
function ShopAssortmentInfo({
  weaponCount,
  armorCount,
}: {
  weaponCount: number;
  armorCount: number;
}) {
  const full = weaponCount === WEAPONS.length && armorCount === ARMORS.length;
  return (
    <p style={{ margin: "6px 0 10px", opacity: 0.85, fontSize: 12 }}>
      この地域の品揃え：武器 {weaponCount}/{WEAPONS.length} ・ 防具 {armorCount}/{ARMORS.length}
      （{full ? "現在、全ての商品が解放されています" : "次のステージで増えます"}）
    </p>
  );
}

/**
 * Weapon shop component
 */
function WeaponShopView({
  player,
  shopAssortment,
  onBuyWeapon,
  onBuyArmor,
  onBack,
  equipDex,
}: {
  player: Player;
  shopAssortment: { weapons: Weapon[]; armors: Armor[] };
  onBuyWeapon: (w: Weapon) => void;
  onBuyArmor: (a: Armor) => void;
  onBack: () => void;
  equipDex: EquipDexState;
}) {
  // 入手済みチェック関数
  const isWeaponOwned = (weaponName: string): boolean => {
    return equipDex.weapons.includes(weaponName);
  };

  const isArmorOwned = (armorName: string): boolean => {
    return equipDex.armors.includes(armorName);
  }; return (
    <div className="shop">
      <h4>🔪 武器・防具屋（所持金 {player.gold}G）</h4>
      <ShopAssortmentInfo
        weaponCount={shopAssortment.weapons.length}
        armorCount={shopAssortment.armors.length}
      />
      <div className="shopList">
        <h5>武器</h5>
        {shopAssortment.weapons.map(w => {
          const owned = isWeaponOwned(w.name);
          return (
            <div className="shopRow" key={w.name}>
              <span>
                {w.name}（ATK+{w.atk}）
                {owned && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>✓</span>}
              </span>
              <span>{w.price}G</span>
              <button onClick={() => onBuyWeapon(w)}>買う</button>
            </div>
          );
        })}
        <h5>防具</h5>
        {shopAssortment.armors.map(a => {
          const owned = isArmorOwned(a.name);
          return (
            <div className="shopRow" key={a.name}>
              <span>
                {a.name}（DEF+{a.def}）
                {owned && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>✓</span>}
              </span>
              <span>{a.price}G</span>
              <button onClick={() => onBuyArmor(a)}>買う</button>
            </div>
          );
        })}
      </div>
      <div className="gBtns">
        <button className="ghost" onClick={onBack}>戻る</button>
      </div>
    </div>
  );
}

/**
 * Tool shop component
 */
function ToolShopView({
  player,
  onBuyTool,
  onBack,
}: {
  player: Player;
  onBuyTool: (t: Tool) => void;
  onBack: () => void;
}) {
  return (
    <div className="shop">
      <h4>🧪 道具屋（所持金 {player.gold}G）</h4>
      {TOOLS.map(tl => (
        <div className="shopRow" key={tl.name}>
          <span>{tl.name}（{getToolEffectDescription(tl)}）</span>
          <span>{tl.price}G</span>
          <button onClick={() => onBuyTool(tl)}>買う</button>
        </div>
      ))}
      <div className="gBtns">
        <button className="ghost" onClick={onBack}>戻る</button>
      </div>
    </div>
  );
}

/**
 * Inn component
 */
function InnView({
  player,
  healCost,
  onRest,
  onBack,
}: {
  player: Player;
  healCost: number;
  onRest: () => void;
  onBack: () => void;
}) {
  const isFullyHealed = player.hp >= player.maxHP && player.mp >= player.maxMP;

  return (
    <div className="inn">
      <p>一泊 {healCost}G ですが、泊まっていかれますか？</p>
      {isFullyHealed && (
        <p style={{ color: "var(--good)" }}>✨ HP/MPは満タンです！</p>
      )}
      <div className="gBtns">
        <button onClick={onRest} disabled={isFullyHealed}>泊まる</button>
        <button className="ghost" onClick={onBack}>やめる</button>
      </div>
    </div>
  );
}

export default function TownOverlay() {
  // Get state and actions from Context
  const { player, equipDex, showTown } = useGameState();
  const {
    setShowTown,
    buyWeaponLocal,
    buyArmorLocal,
    buyToolLocal,
    restAtInnLocal
  } = useGameActions();

  if (!showTown) return null;

  const healCost = healAtInnCost(player);
  const shopAssortment = getShopAssortment(
    player.currentArea,
    player.endlessFloor,
    player.flags?.ultimateUnlocked || false
  );

  const renderContent = () => {
    switch (showTown) {
      case "menu":
        return (
          <TownMenuView
            player={player}
            healCost={healCost}
            onSelectWeapon={() => setShowTown("weapon")}
            onSelectTool={() => setShowTown("tool")}
            onSelectInn={() => setShowTown("inn")}
            onExit={() => setShowTown(null)}
          />
        );
      case "weapon":
        return (
          <WeaponShopView
            player={player}
            shopAssortment={shopAssortment}
            onBuyWeapon={buyWeaponLocal}
            onBuyArmor={buyArmorLocal}
            onBack={() => setShowTown("menu")}
            equipDex={equipDex}
          />
        );
      case "tool":
        return (
          <ToolShopView
            player={player}
            onBuyTool={buyToolLocal}
            onBack={() => setShowTown("menu")}
          />
        );
      case "inn":
        return (
          <InnView
            player={player}
            healCost={healCost}
            onRest={restAtInnLocal}
            onBack={() => setShowTown("menu")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Overlay title="町" onClose={() => setShowTown(null)}>
      {renderContent()}
    </Overlay>
  );
}
